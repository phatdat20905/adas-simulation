import * as alertService from '../services/alertService.js';

const createAlert = async (req, res) => {
  try {
    const { type, description, severity, simulationId, vehicleId, sensorDataId } = req.body;
    if (!type || !description || !severity || !simulationId || !vehicleId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const alert = await alertService.createAlert({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAlerts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const alerts = await alertService.getAlerts(req.user.id, page, limit);
    res.status(200).json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAlert = async (req, res) => {
  try {
    const { type, description, severity } = req.body;
    if (!type && !description && !severity) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
    const alert = await alertService.updateAlert(req.params.id, req.user.id, req.body);
    res.status(200).json({ success: true, data: alert });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const result = await alertService.deleteAlert(req.params.id, req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { createAlert, getAlerts, updateAlert, deleteAlert };