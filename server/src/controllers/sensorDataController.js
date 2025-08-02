import SensorData from '../models/SensorData.js';

const getSensorDataBySimulation = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const query = req.user.role === 'admin' ? { simulationId } : { simulationId, userId: req.user.id };
    const sensorData = await SensorData.find(query).sort({ timestamp: 1 }).lean();
    if (!sensorData.length && req.user.role !== 'admin') {
      return res.status(404).json({ error: 'Sensor data not found or unauthorized' });
    }
    res.status(200).json(sensorData);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch sensor data: ${error.message}` });
  }
};

export { getSensorDataBySimulation };