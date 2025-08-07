import { registerUser, loginUser, refreshToken, getUsers, getCurrentUser, updateUser, deleteUser, logoutUser } from '../services/userService.js';

const register = async (req, res) => {
  try {
    const { username, email, phone, password, role } = req.body;
    if (!username || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    const result = await registerUser({ username, email, phone, password, role });
    res.status(201).json({ success: true, message: 'User registered', ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await loginUser({ email, password });
    res.status(200).json({ success: true, message: 'Login successful', ...result });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }
    const result = await refreshToken(refreshToken);
    res.status(200).json({ success: true, message: 'Token refreshed', ...result });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await getUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    if (!username && !email && !phone && !password) {
      return res.status(400).json({ success: false, message: 'At least one field is required' });
    }
    const user = await updateUser(req.user.id, { username, email, phone, password });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const result = await deleteUser(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const result = await logoutUser(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

export { register, login, refresh, getUsers, getCurrentUser, updateUser, deleteUser, logout };