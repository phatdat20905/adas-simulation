import express from 'express';
import { getSensorDataBySimulation } from '../controllers/sensorDataController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/:simulationId', auth(['user', 'admin']), getSensorDataBySimulation);

export default router;