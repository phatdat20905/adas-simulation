import Vehicle from '../models/Vehicle.js';
import Simulation from '../models/Simulation.js';
import SensorData from '../models/SensorData.js';
import Alert from '../models/Alert.js';

const createAlert = async ({ type, description, severity, simulationId, vehicleId, sensorDataId, userId }) => {
  if (!(await Simulation.exists({ _id: simulationId, userId }))) {
    throw new Error('Invalid simulation');
  }
  if (!(await Vehicle.exists({ _id: vehicleId, owner: userId }))) {
    throw new Error('Invalid vehicle');
  }
  if (sensorDataId && !(await SensorData.exists({ _id: sensorDataId, userId }))) {
    throw new Error('Invalid sensor data');
  }
  const alert = new Alert({ type, description, severity, simulationId, vehicleId, sensorDataId, userId });
  await alert.save();
  return alert;
};

const getAlerts = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const alerts = await Alert.find({ userId }).skip(skip).limit(limit).lean();
  const total = await Alert.countDocuments({ userId });
  return { alerts: alerts || [], totalPages: Math.ceil(total / limit) || 1 };
};

const updateAlert = async (alertId, userId, updates) => {
  const alert = await Alert.findOneAndUpdate(
    { _id: alertId, userId },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
  if (!alert) {
    throw new Error('Alert not found or unauthorized');
  }
  return alert;
};

const deleteAlert = async (alertId, userId) => {
  const alert = await Alert.findOneAndDelete({ _id: alertId, userId });
  if (!alert) {
    throw new Error('Alert not found or unauthorized');
  }
  return { message: 'Alert deleted' };
};

export { createAlert, getAlerts, updateAlert, deleteAlert };