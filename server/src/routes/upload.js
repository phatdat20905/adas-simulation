import express from 'express';
import { uploadFile } from '../controllers/uploadController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth(['user', 'admin']), uploadFile);

export default router;