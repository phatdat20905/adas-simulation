import express from 'express';
import { createSimulation, getSimulations, getSimulationById, updateSimulation, deleteSimulation, simulateADAS } from '../controllers/simulationController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), createSimulation);
router.get('/', auth(['user', 'admin']), getSimulations);
router.get('/:id', auth(['user', 'admin']), getSimulationById);
router.put('/:id', auth(['user', 'admin']), updateSimulation);
router.delete('/:id', auth(['user', 'admin']), deleteSimulation);
router.post('/simulate', auth(['user', 'admin']), simulateADAS);

export default router;