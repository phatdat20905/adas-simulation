import * as vehicleService from '../services/vehicleService.js';

// Create
const createVehicle = async (req, res) => {
  try {
    const { licensePlate, brand, model, color } = req.body;
    if (!licensePlate || !brand || !model || !color) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const vehicle = await vehicleService.createVehicle({
      ...req.body,
      owner: req.user.id, // đảm bảo req.user tồn tại
    });

    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Get list
const getVehicles = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      brand,
      status,
      engineType,
      sort,
    } = req.query;

    const result = await vehicleService.getVehicles({
      role: req.user.role,
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      filters: { brand, status, engineType },
      sort,
    });

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy danh sách xe cho user
const getUserVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", brand, engineType, sort } = req.query;

    const result = await vehicleService.getUserVehicles({
      userId: req.user.id,
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      filters: { brand, engineType },
      sort,
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Detail
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await vehicleService.getVehicleById(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// Update
const updateVehicle = async (req, res) => {
  try {
    if (!Object.keys(req.body).length) {
      return res.status(400).json({
        success: false,
        message: 'At least one field is required',
      });
    }

    const vehicle = await vehicleService.updateVehicle(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteVehicle = async (req, res) => {
  try {
    const result = await vehicleService.deleteVehicle(
      req.params.id,
      req.user.id,
      req.user.role
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  getUserVehicles,
};
