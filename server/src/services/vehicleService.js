import Vehicle from '../models/Vehicle.js';
import Simulation from '../models/Simulation.js';
import Alert from '../models/Alert.js';
import SensorData from '../models/SensorData.js';
import { deleteFileSafe } from './simulationService.js'; // đã có sẵn hàm này

// Create a new vehicle
const createVehicle = async ({
  licensePlate,
  brand,
  model,
  color,
  engineType,
  engineCapacity,
  owner,
}) => {
  const existing = await Vehicle.findOne({ licensePlate });
  if (existing) throw new Error('License plate already exists');

  const vehicle = new Vehicle({
    licensePlate,
    brand,
    model,
    color,
    engineType: engineType || 'petrol',
    engineCapacity,
    owner,
  });

  await vehicle.save();
  return vehicle.toObject();
};

// List vehicles (admin can see all, user sees own)
const getVehicles = async ({
  role,
  userId,
  page = 1,
  limit = 10,
  search = '',
  filters = {},
  sort = '-createdAt',
}) => {
  const skip = (page - 1) * limit;
  const query = {};

  if (role !== 'admin') query.owner = userId;

  if (search) query.licensePlate = { $regex: search, $options: 'i' };
  if (filters.brand) query.brand = filters.brand;
  if (filters.status) query.status = filters.status;
  if (filters.engineType) query.engineType = filters.engineType;

  const sortOption = sort
    ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 }
    : { createdAt: -1 };

  const [vehicles, total] = await Promise.all([
    Vehicle.find(query)
      .populate('owner', 'fullName') // ✅ thêm dòng này
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(),
    Vehicle.countDocuments(query),
  ]);

  return {
    data: vehicles,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    page,
    limit,
  };
};


// List all vehicles of a user (include inactive)
const getUserVehicles = async ({
  userId,
  page = 1,
  limit = 10,
  search = '',
  filters = {},
  sort = '-createdAt',
}) => {
  const skip = (page - 1) * limit;
  const query = { owner: userId };

  if (search) {
    query.$or = [
      { licensePlate: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { model: { $regex: search, $options: 'i' } },
    ];
  }

  if (filters.brand) query.brand = filters.brand;
  if (filters.engineType) query.engineType = filters.engineType;
  if (filters.status) query.status = filters.status;

  const sortOption = sort
    ? { [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1 }
    : { createdAt: -1 };

  const [vehicles, total] = await Promise.all([
    Vehicle.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
    Vehicle.countDocuments(query),
  ]);

  return {
    data: vehicles,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    page,
    limit,
  };
};

// Detail
const getVehicleById = async (id, userId, role) => {
  const query = role === 'admin' ? { _id: id } : { _id: id, owner: userId };
  const vehicle = await Vehicle.findOne(query).lean();
  if (!vehicle) throw new Error('Vehicle not found or unauthorized');
  return vehicle;
};

// Update
const updateVehicle = async (id, userId, role, updates) => {
  const query = role === 'admin' ? { _id: id } : { _id: id, owner: userId };
  const vehicle = await Vehicle.findOneAndUpdate(
    query,
    { $set: updates, updatedAt: Date.now() },
    { new: true, runValidators: true }
  ).lean();
  if (!vehicle) throw new Error('Vehicle not found or unauthorized');
  return vehicle;
};

const deleteVehicle = async (vehicleId, userId, role) => {
  // 1. Nếu không phải admin chỉ được xóa xe của chính mình
  const query = role === 'admin' ? { _id: vehicleId } : { _id: vehicleId, owner: userId };

  // 2. Tìm và xóa vehicle
  const vehicle = await Vehicle.findOneAndDelete(query);
  if (!vehicle) {
    throw new Error('Vehicle not found or unauthorized');
  }

  // 3. Lấy danh sách các simulation liên quan để xóa file
  const simulations = await Simulation.find({ vehicleId: vehicle._id });

  // 4. Xóa tất cả dữ liệu liên quan
  await Promise.all([
    SensorData.deleteMany({ vehicleId: vehicle._id }),
    Alert.deleteMany({ vehicleId: vehicle._id }),
    Simulation.deleteMany({ vehicleId: vehicle._id }),
  ]);

  // 5. Xóa file của từng simulation (nếu có)
  for (const sim of simulations) {
    if (sim.filepath) await deleteFileSafe(sim.filepath);
    if (sim.videoUrl) await deleteFileSafe(sim.videoUrl);
  }

  return { message: 'Vehicle and all related data/files deleted' };
};


export {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getUserVehicles,
};
