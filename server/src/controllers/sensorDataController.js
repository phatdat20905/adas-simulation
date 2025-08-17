import * as sensorDataService from '../services/sensorDataService.js';

const createSensorData = async (req, res) => {
  try {
    const { vehicleId, simulationId, timestamp, speed, distance_to_object, lane_status, obstacle_detected, camera_frame_url } = req.body;
    if (!vehicleId || !simulationId || !timestamp || !speed || !lane_status) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const sensorData = await sensorDataService.createSensorData({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: sensorData });
  } catch (error) {
    console.error('Create sensor data error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSensorData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sensorData = await sensorDataService.getSensorData(req.user.id, page, limit, req.user.role);
    res.status(200).json({ success: true, data: sensorData });
  } catch (error) {
    console.error('Get sensor data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSensorDataBySimulation = async (req, res) => {
  try {
    const { simulationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const sensorData = await sensorDataService.getSensorDataBySimulation(simulationId, req.user.id, page, limit, req.user.role);
    res.status(200).json({ success: true, data: sensorData });
  } catch (error) {
    console.error('Get sensor data by simulation error:', error);
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateSensorData = async (req, res) => {
  try {
    const { speed, distance_to_object, lane_status, obstacle_detected, camera_frame_url } = req.body;
    if (!speed && !distance_to_object && !lane_status && !obstacle_detected && !camera_frame_url) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
    const sensorData = await sensorDataService.updateSensorData(req.params.id, req.user.id, req.body, req.user.role);
    res.status(200).json({ success: true, data: sensorData });
  } catch (error) {
    console.error('Update sensor data error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteSensorData = async (req, res) => {
  try {
    const result = await sensorDataService.deleteSensorData(req.params.id, req.user.id, req.user.role);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Delete sensor data error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export { createSensorData, getSensorData, getSensorDataBySimulation, updateSensorData, deleteSensorData };