import express from 'express';
import { register, login, refresh, getUsers, getCurrentUser, updateUser, deleteUser, logout } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/', auth(['admin']), getUsers);
router.get('/me', auth(['user', 'admin']), getCurrentUser);
router.put('/me', auth(['user', 'admin']), updateUser);
router.delete('/me', auth(['user', 'admin']), deleteUser);
router.post('/logout', auth(['user', 'admin']), logout);

export default router;