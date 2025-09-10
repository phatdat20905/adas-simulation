import Vehicle from '../models/Vehicle.js';
import Simulation from '../models/Simulation.js';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';
import fs, { promises as fsp } from "fs";
import path from "path";
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const createSimulation = async ({ filename, filepath, fileType, vehicleId, userId }) => {
  if (!(await Vehicle.exists({ _id: vehicleId, owner: userId }))) {
    throw new Error('Invalid vehicle or unauthorized');
  }
  const simulation = new Simulation({ filename, filepath, fileType, vehicleId, userId, status: 'pending' });
  await simulation.save();
  return simulation;
};

const getSimulations = async (userId, page, limit, role) => {
  const skip = (page - 1) * limit;
  const query = role === 'admin' ? {} : { userId };
  const [simulations, total] = await Promise.all([
    Simulation.find(query).skip(skip).limit(limit).lean(),
    Simulation.countDocuments(query),
  ]);
  return {
    simulations: simulations || [],
    totalPages: Math.ceil(total / limit) || 1,
    totalItems: total,
  };
};

const getSimulationById = async (simulationId, userId, role) => {
  const query = role === 'admin' ? { _id: simulationId } : { _id: simulationId, userId };
  const simulation = await Simulation.findOne(query).lean();
  if (!simulation) {
    throw new Error('Simulation not found or unauthorized');
  }
  return simulation;
};

const updateSimulation = async (simulationId, userId, updates, role) => {
  const allowedFields = ['filename', 'filepath', 'fileType', 'status', 'result', 'videoUrl'];
  const safeUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) safeUpdates[key] = updates[key];
  }

  const query = role === 'admin' ? { _id: simulationId } : { _id: simulationId, userId };
  const simulation = await Simulation.findOneAndUpdate(query, { $set: safeUpdates }, { new: true, runValidators: true }).lean();
  if (!simulation) {
    throw new Error('Simulation not found or unauthorized');
  }
  return simulation;
};

/**
 * Xóa file an toàn (không throw nếu file không tồn tại).
 */
const deleteFileSafe = async (relativePath) => {
  if (!relativePath) return;
  try {
    // chuẩn hóa thành absolute path
    const absPath = path.resolve(__dirname, "../../", relativePath.replace(/^\/+/, ""));
    console.log(`🔍 Đang cố xóa file: ${absPath}`);
    await fsp.unlink(absPath); // 👈 dùng fsp thay vì fs
    console.log(`🗑️ Deleted file: ${absPath}`);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.warn(`⚠️ File không tồn tại: ${relativePath}`);
    } else {
      console.error(`❌ Lỗi khi xóa file: ${relativePath}`, err.message);
    }
  }
};

/**
 * Xóa simulation và toàn bộ dữ liệu/file liên quan
 */
const deleteSimulation = async (simulationId, userId, role) => {
  const query = role === "admin" ? { _id: simulationId } : { _id: simulationId, userId };

  const simulation = await Simulation.findOneAndDelete(query);
  if (!simulation) {
    throw new Error("Simulation not found or unauthorized");
  }

  // Xóa dữ liệu liên quan
  await Promise.all([
    SensorData.deleteMany({ simulationId }),
    Alert.deleteMany({ simulationId }),
  ]);

  // Xóa video upload gốc
  if (simulation.filepath) {
    await deleteFileSafe(simulation.filepath);
  }

  // Xóa video đã xử lý (Processed)
  if (simulation.videoUrl) {
    await deleteFileSafe(simulation.videoUrl);
  }

  return { message: "Simulation, related data, and files deleted" };
};



const getSimulationVideoStream = async (id, range, res) => {
  const simulation = await Simulation.findById(id);

  if (!simulation || !simulation.videoUrl) {
    throw new Error("Video không tồn tại");
  }

  const filePath = path.join(process.cwd(), simulation.videoUrl);
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
      "Access-Control-Allow-Origin": "*", // thêm để chắc ăn
      "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

export { createSimulation, getSimulations, getSimulationById, updateSimulation, deleteSimulation, getSimulationVideoStream };
