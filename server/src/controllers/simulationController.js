import Simulation from '../models/Simulation.js';
import Alert from '../models/Alert.js';
import SensorData from '../models/SensorData.js';
import { processADAS } from '../services/adasService.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const simulateADAS = async (req, res) => {
  const { simulationId } = req.body;

  if (!simulationId) {
    return res.status(400).json({ error: 'Simulation ID is required' });
  }

  try {
    const simulation = await Simulation.findById(simulationId);
    if (!simulation || (req.user.role !== 'admin' && simulation.userId.toString() !== req.user.id)) {
      return res.status(404).json({ error: 'Simulation not found or unauthorized' });
    }

    // Call Python microservice
    const results = await processADAS(
      join(__dirname, '../../', simulation.filepath),
      simulation.vehicleId.toString(),
      simulationId,
      simulation.userId.toString()
    );

    // Update simulation
    simulation.result = results.summary || {};
    simulation.status = results.status || 'completed';
    simulation.sensorDataCount = results.sensorData?.length || 0;
    await simulation.save();

    // Save sensor data
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
        alertLevel: data.alertLevel,
      }));
      await SensorData.insertMany(sensorDataDocs);
    }

    // Save alerts
    if (results.alerts && results.alerts.length) {
      const savedAlerts = await Alert.insertMany(results.alerts);
      // Update sensorDataId in alerts
      for (let i = 0; i < savedAlerts.length && i < results.sensorData.length; i++) {
        const sensorData = await SensorData.findOne({
          simulationId,
          timestamp: new Date(results.sensorData[i].timestamp),
        });
        if (sensorData) {
          await Alert.findByIdAndUpdate(savedAlerts[i]._id, { sensorDataId: sensorData._id });
        }
      }
    }

    res.status(200).json({
      message: 'Simulation completed',
      simulation,
    });
  } catch (error) {
    simulation.status = 'failed';
    await simulation.save();
    res.status(500).json({ error: `Simulation failed: ${error.message}` });
  }
};

const getSimulations = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const simulations = await Simulation.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json(simulations);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch simulations: ${error.message}` });
  }
};

export { simulateADAS, getSimulations };
