import * as userService from '../services/userService.js';

const register = async (req, res) => {
  try {
    const { fullName, email, phone, password, role, address, image, active } = req.body;
    if (!fullName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All required fields are required' });
    }
    const result = await userService.registerUser({ fullName, email, phone, password, role, address, image, active });
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
    const result = await userService.loginUser({ email, password });
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
    const result = await userService.refreshToken(refreshToken);
    res.status(200).json({ success: true, message: 'Token refreshed', ...result });
  } catch (error) {
    res.status(403).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = '',
      active = '',
      sort = '-createdAt',
    } = req.query;

    const result = await userService.getUsers({
      page: Number(page),
      limit: Number(limit),
      search: String(search),
      role: role ? String(role) : '',
      active: active !== '' ? active === 'true' : '',
      sort: String(sort),
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await userService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ success: false, message: "No fields provided" });
    }

    const user = await userService.updateUser(req.params.id, req.body);

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { hard } = req.query; // ?hard=true nếu muốn xóa hẳn
    const result = await userService.deleteUser(req.params.id, hard === "true");

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const result = await userService.logoutUser(req.user.id);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};


export { register, login, refresh, getUsers, getCurrentUser, updateUser, deleteUser, logout };