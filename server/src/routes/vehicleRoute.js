import express from 'express';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle } from '../controllers/vehicleController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), createVehicle);
router.get('/', auth(['user', 'admin']), getVehicles);
router.put('/:id', auth(['user', 'admin']), updateVehicle);
router.delete('/:id', auth(['user', 'admin']), deleteVehicle);

export default router;