import express from 'express';
import { createSensorData, getSensorData, getSensorDataBySimulation, updateSensorData, deleteSensorData } from '../controllers/sensorDataController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), createSensorData);
router.get('/', auth(['user', 'admin']), getSensorData);
router.get('/simulation/:simulationId', auth(['user', 'admin']), getSensorDataBySimulation);
router.put('/:id', auth(['user', 'admin']), updateSensorData);
router.delete('/:id', auth(['user', 'admin']), deleteSensorData);

export default router;