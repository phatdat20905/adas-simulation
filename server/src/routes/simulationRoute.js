import express from 'express';
import { simulateADAS, getSimulations } from '../controllers/simulationController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), simulateADAS);
router.get('/', auth(['user', 'admin']), getSimulations);

export default router;