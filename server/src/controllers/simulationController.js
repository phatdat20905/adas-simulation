import * as simulationService from '../services/simulationService.js';
import { processADAS } from '../services/adasService.js';
import { emitAlert } from '../socket.js';
import Simulation from '../models/Simulation.js';
import Alert from '../models/Alert.js';
import SensorData from '../models/SensorData.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { io } from '../server.js'; // Đảm bảo đường dẫn đúng với cấu trúc dự án

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
    console.log('getSimulations called with userId:', req.user.id, 'query:', req.query);
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
    const { filename, filepath, fileType, status, result } = req.body;
    if (!filename && !filepath && !fileType && !status && !result) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
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

const simulateADAS = async (req, res) => {
  const { simulationId } = req.body;

  if (!simulationId) {
    return res.status(400).json({ success: false, message: 'Simulation ID is required' });
  }

  try {
    const simulation = await Simulation.findById(simulationId);
    if (!simulation || (req.user.role !== 'admin' && simulation.userId.toString() !== req.user.id)) {
      return res.status(404).json({ success: false, message: 'Simulation not found or unauthorized' });
    }

    const absoluteFilepath = join(__dirname, '../../', simulation.filepath);
    console.log('Simulate ADAS filepath:', absoluteFilepath);
    const results = await processADAS(
      simulation.filepath,
      simulation.vehicleId.toString(),
      simulationId,
      simulation.userId.toString()
    ).catch((error) => {
      console.error('ADAS processing error:', error);
      throw new Error(`ADAS processing failed: ${error.message}`);
    });

    // Chuyển đổi camera_frame_url thành URL đầy đủ nếu cần
    if (results.sensorData) {
      results.sensorData = results.sensorData.map(data => ({
        ...data,
        camera_frame_url: data.camera_frame_url ? `http://localhost:5000${data.camera_frame_url}` : null,
      }));
    }

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

    if (results.sensorData && results.sensorData.length) {
      const sensorDataDocs = results.sensorData.map((data) => ({
        vehicleId: data.vehicleId,
        simulationId: data.simulationId,
        userId: data.userId,
        timestamp: new Date(data.timestamp),
        speed: data.speed,
        distance_to_object: data.distance_to_object,
        lane_status: data.lane_status,
        obstacle_detected: data.obstacle_detected,
        camera_frame_url: data.camera_frame_url,
      }));
      await SensorData.insertMany(sensorDataDocs);
    }

    if (results.alerts && results.alerts.length) {
      const savedAlerts = await Alert.insertMany(
        results.alerts.map((alert) => ({
          ...alert,
          userId: simulation.userId,
          vehicleId: simulation.vehicleId,
          simulationId,
        }))
      );

      savedAlerts.forEach((alert) => {
        emitAlert(io, simulation.userId.toString(), alert);
      });

      for (let i = 0; i < savedAlerts.length && i < results.sensorData?.length; i++) {
        const sensorData = await SensorData.findOne({
          simulationId,
          timestamp: new Date(results.sensorData[i].timestamp),
        });
        if (sensorData) {
          await Alert.findByIdAndUpdate(savedAlerts[i]._id, { sensorDataId: sensorData._id });
        }
      }
    }

    io.to(simulation.userId.toString()).emit('simulationStatus', {
      simulationId,
      status: simulation.status,
      videoUrl: simulation.videoUrl,
    });

    res.status(200).json({
      success: true,
      message: 'Simulation completed',
      data: { ...simulation.toObject(), videoUrl: simulation.videoUrl },
    });
  } catch (error) {
    console.error('Simulate ADAS error:', error);
    const simulation = await Simulation.findById(simulationId);
    if (simulation) {
      simulation.status = 'failed';
      await simulation.save();
      io.to(simulation.userId.toString()).emit('simulationStatus', {
        simulationId,
        status: 'failed',
      });
    }
    res.status(500).json({ success: false, message: `Simulation failed: ${error.message}` });
  }
};

export { createSimulation, getSimulations, getSimulationById, updateSimulation, deleteSimulation, simulateADAS };