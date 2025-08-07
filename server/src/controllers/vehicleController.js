import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from '../services/vehicleService.js';

const createVehicle = async (req, res) => {
  try {
    const { licensePlate, brand, model, color, engineType, engineCapacity } = req.body;
    if (!licensePlate || !brand || !model || !color) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const vehicle = await createVehicle({ ...req.body, owner: req.user.id });
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const vehicles = await getVehicles(req.user.id, page, limit);
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateVehicle = async (req, res) => {
  try {
    const { licensePlate, brand, model, color, engineType, engineCapacity } = req.body;
    if (!licensePlate && !brand && !model && !color && !engineType && !engineCapacity) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
    const vehicle = await updateVehicle(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteVehicle = async (req, res) => {
  try {
    const result = await deleteVehicle(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { createVehicle, getVehicles, updateVehicle, deleteVehicle };