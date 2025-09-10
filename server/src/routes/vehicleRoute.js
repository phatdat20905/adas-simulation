import express from 'express';
import { createVehicle, getVehicles, updateVehicle, deleteVehicle, getVehicleById, getUserVehicles } from '../controllers/vehicleController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), createVehicle);
router.get("/me", auth(["user", "admin"]), getUserVehicles);
router.get('/', auth(['admin']), getVehicles);
router.get('/:id', auth(['user', 'admin']), getVehicleById);
router.put('/:id', auth(['user', 'admin']), updateVehicle);
router.delete('/:id', auth(['user', 'admin']), deleteVehicle);

export default router;
