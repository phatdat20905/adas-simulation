import Vehicle from '../models/Vehicle.js';

const createVehicle = async ({ licensePlate, brand, model, color, engineType, engineCapacity, owner }) => {
  const existingVehicle = await Vehicle.findOne({ licensePlate });
  if (existingVehicle) {
    throw new Error('Biển số đã tồn tại');
  }
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
  return vehicle;
};

const getVehicles = async (userId, page, limit) => {
  const skip = (page - 1) * limit;
  const vehicles = await Vehicle.find({ owner: userId }).skip(skip).limit(limit).lean();
  const total = await Vehicle.countDocuments({ owner: userId });
  return { vehicles: vehicles || [], totalPages: Math.ceil(total / limit) || 1 };
};

const updateVehicle = async (vehicleId, userId, updates) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: vehicleId, owner: userId },
    { $set: updates },
    { new: true, runValidators: true }
  ).lean();
  if (!vehicle) {
    throw new Error('Vehicle not found or unauthorized');
  }
  return vehicle;
};

const deleteVehicle = async (vehicleId, userId) => {
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: vehicleId, owner: userId },
    { $set: { status: 'inactive', updatedAt: Date.now() } },
    { new: true }
  );
  if (!vehicle) {
    throw new Error('Vehicle not found or unauthorized');
  }
  return { message: 'Vehicle deactivated' };
};

export { createVehicle, getVehicles, updateVehicle, deleteVehicle };