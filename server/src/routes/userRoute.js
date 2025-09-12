import express from 'express';
import {
  register,
  login,
  refresh,
  getUsers,
  getCurrentUser,
  updateUser,
  deleteUser,
  logout,
} from '../controllers/userController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Auth
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/logout', auth(['user', 'admin']), logout);

// Lấy thông tin user hiện tại
router.get('/me', auth(['user', 'admin']), getCurrentUser);

// Admin lấy danh sách user
router.get('/', auth(['admin']), getUsers);

// Update & Delete (chung cho cả user thường và admin)
router.put('/:id', auth(['user', 'admin']), updateUser);
router.delete('/:id', auth(['user', 'admin']), deleteUser);

export default router;
