import * as simulationService from '../services/simulationService.js';
import { processADAS } from '../services/adasService.js';
import { emitAlert, getIo } from '../utils/socket.js';
import Simulation from '../models/Simulation.js';
import Alert from '../models/Alert.js';
import SensorData from '../models/SensorData.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


const createSimulation = async (req, res) => {
  try {
    const { filename, filepath, fileType, vehicleId } = req.body;
    if (!filename || !filepath || !fileType || !vehicleId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const simulation = await simulationService.createSimulation({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: simulation });
  } catch (error) {
    console.error('Create simulation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSimulations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const simulations = await simulationService.getSimulations(req.user.id, page, limit, req.user.role);
    res.status(200).json({ success: true, data: simulations });
  } catch (error) {
    console.error('Get simulations error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSimulationById = async (req, res) => {
  try {
    const simulation = await simulationService.getSimulationById(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, data: simulation });
  } catch (error) {
    console.error('Get simulation by ID error:', error);
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateSimulation = async (req, res) => {
  try {
    const simulation = await simulationService.updateSimulation(req.params.id, req.user.id, req.body, req.user.role);
    res.status(200).json({ success: true, data: simulation });
  } catch (error) {
    console.error('Update simulation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSimulation = async (req, res) => {
  try {
    const result = await simulationService.deleteSimulation(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Delete simulation error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const allowedLaneStatuses = ['within', 'departing', 'crossed', 'lost'];

const simulateADAS = async (req, res) => {
  const { simulationId } = req.body;
  const io = getIo();

  if (!simulationId) {
    return res.status(400).json({ success: false, message: 'Simulation ID is required' });
  }

  try {
    // 🔹 Tìm simulation
    const simulation = await Simulation.findById(simulationId);
    if (!simulation || (req.user.role !== 'admin' && simulation.userId.toString() !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Simulation not found or unauthorized' });
    }

    console.log('🚀 Starting ADAS simulation:', simulation.filepath);

    // 🔹 Gọi Python service
    const results = await processADAS(
      simulation.filepath,
      simulation.vehicleId.toString(),
      simulationId,
      simulation.userId.toString()
    );


    // 🔹 Normalize frame URL
    if (results.sensorData) {
      results.sensorData = results.sensorData.map((data) => ({
        ...data,
        camera_frame_url: data.camera_frame_url
          ? `/Processed/frames/${data.camera_frame_url.split('/').pop()}`
          : null,
      }));
    }

    // 🔹 Update simulation info
    simulation.result = results.summary || {
      totalAlerts: 0,
      collisionCount: 0,
      laneDepartureCount: 0,
      obstacleCount: 0,
      trafficSignCount: 0,
    };
    simulation.status = results.status || 'completed';
    simulation.sensorDataCount = results.sensorData?.length || 0;
    simulation.videoUrl = results.videoUrl || null;
    await simulation.save();

    // 🔹 Insert SensorData (cho phép speed âm hoặc null, thêm TTC/warn/trackId/frameIndex)
    if (results.sensorData?.length) {
      const sensorDataDocs = results.sensorData.map((data) => ({
        vehicleId: data.vehicleId,
        simulationId,
        userId: data.userId,
        timestamp: new Date(data.timestamp),
        speed: typeof data.speed === 'number' ? data.speed : null,  // giữ null hoặc âm
        distance_to_object:
          typeof data.distance_to_object === 'number' ? data.distance_to_object : null,
        lane_status: allowedLaneStatuses.includes(data.lane_status)
          ? data.lane_status
          : 'within',
        obstacle_detected: !!data.obstacle_detected,
        camera_frame_url: data.camera_frame_url || null,

        // 🔹 các field mới từ Python
        ttc: typeof data.ttc === 'number' ? data.ttc : null,
        warn: !!data.warn,
        trackId: typeof data.track_id === 'number' ? data.track_id : null,
        frameIndex: typeof data.frame_index === 'number' ? data.frame_index : null,
      }));

      try {
        await SensorData.insertMany(sensorDataDocs, { ordered: false });
      } catch (insertErr) {
        console.error('⚠️ Some SensorData documents failed to insert:', insertErr.message);
      }
    }

    // 🔹 Insert Alerts (gắn đúng sensorData theo trackId)
    if (results.alerts?.length) {
      const alertDocs = results.alerts.map((alert) => ({
        ...alert,
        userId: simulation.userId,
        vehicleId: simulation.vehicleId,
        simulationId,
      }));

      let savedAlerts = [];
      try {
        savedAlerts = await Alert.insertMany(alertDocs, { ordered: false });
      } catch (insertErr) {
        console.error('⚠️ Some Alerts failed to insert:', insertErr.message);
      }

      // Emit alerts qua socket
      savedAlerts.forEach((alert) => {
        emitAlert(io, simulation.userId.toString(), alert);
      });

      // Gắn sensorDataId theo trackId gần nhất
      for (let alert of savedAlerts) {
        if (alert.track_id != null) {
          const nearestSensor = await SensorData.findOne({
            simulationId,
            trackId: alert.track_id,
          }).sort({ frameIndex: -1 });

          if (nearestSensor) {
            await Alert.findByIdAndUpdate(alert._id, { sensorDataId: nearestSensor._id });
          }
        }
      }
    }

    // 🔹 Notify frontend
    io.to(simulation.userId.toString()).emit('simulationStatus', {
      simulationId,
      status: simulation.status,
      videoUrl: simulation.videoUrl,
      result: simulation.result,
    });

    return res.status(200).json({
      success: true,
      message: 'Simulation completed',
      data: { ...simulation.toObject(), videoUrl: simulation.videoUrl },
    });
  } catch (error) {
    console.error('❌ Simulate ADAS error:', error);

    // Mark simulation as failed
    const simulation = await Simulation.findById(simulationId);
    if (simulation) {
      simulation.status = 'failed';
      await simulation.save();
      io.to(simulation.userId.toString()).emit('simulationStatus', {
        simulationId,
        status: 'failed',
      });
    }

    return res.status(500).json({
      success: false,
      message: `Simulation failed: ${error.message}`,
    });
  }
};

const streamSimulationVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const range = req.headers.range;
    await simulationService.getSimulationVideoStream(id, range, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export { createSimulation, getSimulations, getSimulationById, updateSimulation, deleteSimulation, simulateADAS, streamSimulationVideo };
