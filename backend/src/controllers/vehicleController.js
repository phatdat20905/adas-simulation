import Vehicle from '../models/Vehicle.js';

const createVehicle = async (req, res) => {
  try {
    const { licensePlate, brand, model, year } = req.body;
    const vehicle = new Vehicle({
      licensePlate,
      brand,
      model,
      year,
      owner: req.user.id,
    });

    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(400).json({ error: `Failed to create vehicle: ${error.message}` });
  }
};

const getVehicles = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { owner: req.user.id };
    const vehicles = await Vehicle.find(query).lean();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ error: `Failed to fetch vehicles: ${error.message}` });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const query = req.user.role === 'admin' ? { _id: id } : { _id: id, owner: req.user.id };
    const vehicle = await Vehicle.findOneAndDelete(query);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }
    res.status(200).json({ message: 'Vehicle deleted' });
  } catch (error) {
    res.status(500).json({ error: `Failed to delete vehicle: ${error.message}` });
  }
};

export { createVehicle, getVehicles, deleteVehicle };