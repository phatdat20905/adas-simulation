import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const registerUser = async ({ username, email, phone, password, role }) => {
  const existingUser = await User.findOne({ $or: [{ username }, { email }, { phone }] });
  if (existingUser) {
    throw new Error('Username, email, or phone already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    username,
    email,
    phone,
    password: hashedPassword,
    role: role || 'user',
  });
  await user.save();

  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  user.refreshToken = refreshToken;
  await user.save();

  return { user: { id: user._id, username, email, phone, role }, accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  user.refreshToken = refreshToken;
  await user.save();

  return { user: { id: user._id, username: user.username, email, phone: user.phone, role: user.role }, accessToken, refreshToken };
};

const refreshToken = async (refreshToken) => {
  const user = await User.findOne({ refreshToken });
  if (!user) {
    throw new Error('Invalid refresh token');
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  return { accessToken };
};

const getUsers = async () => {
  return await User.find().select('-password -refreshToken').lean();
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken').lean();
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

const updateUser = async (userId, { username, email, phone, password }) => {
  const updates = {};
  if (username) updates.username = username;
  if (email) updates.email = email;
  if (phone) updates.phone = phone;
  if (password) updates.password = await bcrypt.hash(password, 10);

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password -refreshToken');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: null, updatedAt: Date.now() } },
    { new: true }
  );
  if (!user) {
    throw new Error('User not found');
  }
  return { message: 'User account deactivated' };
};

const logoutUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { refreshToken: null } },
    { new: true }
  );
  if (!user) {
    throw new Error('User not found');
  }
  return { message: 'Logged out successfully' };
};

export { registerUser, loginUser, refreshToken, getUsers, getCurrentUser, updateUser, deleteUser, logoutUser };