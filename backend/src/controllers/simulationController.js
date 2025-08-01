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
    const results = await processADAS(join(__dirname, '../../', simulation.filepath));

    // Update simulation
    simulation.result = results.summary || {};
    simulation.status = results.status || 'completed';
    simulation.sensorDataCount = results.sensorData?.length || 0;
    await simulation.save();

    // Save sensor data
    if (results.sensorData && results.sensorData.length) {
      const sensorDataDocs = results.sensorData.map((data) => ({
        ...data,
        simulationId,
        vehicleId: simulation.vehicleId,
        userId: simulation.userId,
      }));
      await SensorData.insertMany(sensorDataDocs);

      // Create alerts for high/low alertLevel
      const alerts = results.sensorData
        .filter((data) => data.alertLevel && data.alertLevel !== 'none')
        .map((data) => ({
          type: data.alertLevel === 'high' ? 'collision' : 'obstacle',
          description: `Alert at ${data.timestamp}: ${data.lane_status}, distance ${data.distance_to_object || 'N/A'}m`,
          severity: data.alertLevel,
          simulationId,
          sensorDataId: null, // Will be updated after SensorData is saved
          vehicleId: simulation.vehicleId,
          userId: simulation.userId,
        }));
      if (alerts.length) {
        const savedAlerts = await Alert.insertMany(alerts);
        // Update sensorDataId in alerts
        for (let i = 0; i < savedAlerts.length; i++) {
          await SensorData.findOneAndUpdate(
            { simulationId, timestamp: results.sensorData[i].timestamp },
            { $set: { alertLevel: savedAlerts[i].severity } }
          );
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