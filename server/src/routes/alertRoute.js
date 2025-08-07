import express from 'express';
import { createAlert, getAlerts, updateAlert, deleteAlert } from '../controllers/alertController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), createAlert);
router.get('/', auth(['user', 'admin']), getAlerts);
router.put('/:id', auth(['user', 'admin']), updateAlert);
router.delete('/:id', auth(['user', 'admin']), deleteAlert);

export default router;