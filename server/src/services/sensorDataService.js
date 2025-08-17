import Vehicle from '../models/Vehicle.js';
import Simulation from '../models/Simulation.js';
import SensorData from '../models/SensorData.js';

const createSensorData = async ({ vehicleId, simulationId, userId, timestamp, speed, distance_to_object, lane_status, obstacle_detected, camera_frame_url }) => {
  if (!(await Simulation.exists({ _id: simulationId, userId }))) {
    throw new Error('Invalid simulation or unauthorized');
  }
  if (!(await Vehicle.exists({ _id: vehicleId, owner: userId }))) {
    throw new Error('Invalid vehicle or unauthorized');
  }
  const sensorData = new SensorData({
    vehicleId,
    simulationId,
    userId,
    timestamp,
    speed,
    distance_to_object,
    lane_status,
    obstacle_detected,
    camera_frame_url,
  });
  await sensorData.save();
  return sensorData;
};

const getSensorData = async (userId, page, limit, role) => {
  const skip = (page - 1) * limit;
  const query = role === 'admin' ? {} : { userId };
  const sensorData = await SensorData.find(query).skip(skip).limit(limit).lean();
  const total = await SensorData.countDocuments(query);
  return { sensorData: sensorData || [], totalPages: Math.ceil(total / limit) || 1 };
};

const getSensorDataBySimulation = async (simulationId, userId, page, limit, role) => {
  if (!(await Simulation.exists({ _id: simulationId, userId: role === 'admin' ? { $exists: true } : userId }))) {
    throw new Error('Simulation not found or unauthorized');
  }
  const skip = (page - 1) * limit;
  const query = role === 'admin' ? { simulationId } : { simulationId, userId };
  const sensorData = await SensorData.find(query).sort({ timestamp: 1 }).skip(skip).limit(limit).lean();
  const total = await SensorData.countDocuments(query);
  return { sensorData: sensorData || [], totalPages: Math.ceil(total / limit) || 1 };
};

const updateSensorData = async (sensorDataId, userId, updates, role) => {
  const query = role === 'admin' ? { _id: sensorDataId } : { _id: sensorDataId, userId };
  const sensorData = await SensorData.findOneAndUpdate(
    query,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
  if (!sensorData) {
    throw new Error('Sensor data not found or unauthorized');
  }
  return sensorData;
};

const deleteSensorData = async (sensorDataId, userId, role) => {
  const query = role === 'admin' ? { _id: sensorDataId } : { _id: sensorDataId, userId };
  const sensorData = await SensorData.findOneAndDelete(query);
  if (!sensorData) {
    throw new Error('Sensor data not found or unauthorized');
  }
  return { message: 'Sensor data deleted' };
};

export { createSensorData, getSensorData, getSensorDataBySimulation, updateSensorData, deleteSensorData };