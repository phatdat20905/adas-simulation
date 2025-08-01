import express from 'express';
import { getAlerts, deleteAlert } from '../controllers/alertController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth(['user', 'admin']), getAlerts);
router.delete('/:id', auth(['user', 'admin']), deleteAlert);

export default router;