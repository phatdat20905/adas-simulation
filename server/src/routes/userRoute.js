import express from 'express';
import { register, login, refresh, getUsers, getCurrentUser, updateUser, deleteUser, logout,
  updateUserByAdmin, deleteUserByAdmin } from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

// Admin
router.get('/', auth(['admin']), getUsers);
router.put('/:id', auth(['admin']), updateUserByAdmin);
router.delete('/:id', auth(['admin']), deleteUserByAdmin);

// Me
router.get('/me', auth(['user', 'admin']), getCurrentUser);
router.put('/me', auth(['user', 'admin']), updateUser);
router.delete('/me', auth(['user', 'admin']), deleteUser);
router.post('/logout', auth(['user', 'admin']), logout);

export default router;
