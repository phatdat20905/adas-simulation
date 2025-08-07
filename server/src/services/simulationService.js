import Vehicle from '../models/Vehicle.js';
import Simulation from '../models/Simulation.js';

const createSimulation = async ({ filename, filepath, fileType, vehicleId, userId }) => {
  if (!(await Vehicle.exists({ _id: vehicleId, owner: userId }))) {
    throw new Error('Invalid vehicle or unauthorized');
  }
  const simulation = new Simulation({ filename, filepath, fileType, vehicleId, userId, status: 'pending' });
  await simulation.save();
  return simulation;
};

const getSimulations = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const query = req.user.role === 'admin' ? {} : { userId };
  const simulations = await Simulation.find(query).skip(skip).limit(limit).lean();
  const total = await Simulation.countDocuments(query);
  return { simulations: simulations || [], totalPages: Math.ceil(total / limit) || 1 };
};

const getSimulationById = async (simulationId, userId) => {
  const query = req.user.role === 'admin' ? { _id: simulationId } : { _id: simulationId, userId };
  const simulation = await Simulation.findOne(query).lean();
  if (!simulation) {
    throw new Error('Simulation not found or unauthorized');
  }
  return simulation;
};

const updateSimulation = async (simulationId, userId, updates) => {
  const query = req.user.role === 'admin' ? { _id: simulationId } : { _id: simulationId, userId };
  const simulation = await Simulation.findOneAndUpdate(
    query,
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
  if (!simulation) {
    throw new Error('Simulation not found or unauthorized');
  }
  return simulation;
};

const deleteSimulation = async (simulationId, userId) => {
  const query = req.user.role === 'admin' ? { _id: simulationId } : { _id: simulationId, userId };
  const simulation = await Simulation.findOneAndDelete(query);
  if (!simulation) {
    throw new Error('Simulation not found or unauthorized');
  }
  return { message: 'Simulation deleted' };
};

export { createSimulation, getSimulations, getSimulationById, updateSimulation, deleteSimulation };