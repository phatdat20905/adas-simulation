import express from 'express';
import userRoutes from './userRoute.js';
import vehicleRoutes from './vehicleRoute.js';
import uploadRoutes from './uploadRoute.js';
import simulationRoutes from './simulationRoute.js';
import alertRoutes from './alertRoute.js';
import sensorDataRoutes from './sensorDataRoute.js'

const router = express.Router();

router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/upload', uploadRoutes);
router.use('/simulate', simulationRoutes);
router.use('/alerts', alertRoutes);
router.use('/sensordata', sensorDataRoutes);

export default router;