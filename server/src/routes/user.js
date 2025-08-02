import express from 'express';
import { register, login, getUsers } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/', auth(['admin']), getUsers);

export default router;