import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Simulation from '../models/Simulation.js';
import Alert from '../models/Alert.js';
import SensorData from '../models/SensorData.js';
import { deleteFileSafe } from './simulationService.js'; 

const registerUser = async ({ fullName, email, phone, password, role, address, image, active }) => {
  const existingUser = await User.findOne({ $or: [{ fullName }, { email }, { phone }] });
  if (existingUser) {
    throw new Error('Full name, email, or phone already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({
    fullName,
    email,
    phone,
    password: hashedPassword,
    role: role || 'user',
    address,
    image,
    active: active !== undefined ? active : true,
  });
  await user.save();

  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  user.refreshToken = refreshToken;
  await user.save();

  return { user: { id: user._id, fullName, email, phone, role, address, image, active: user.active }, accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email, active: true });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Invalid credentials');
  }

  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  user.refreshToken = refreshToken;
  await user.save();

  return { user: { id: user._id, fullName: user.fullName, email, phone: user.phone, role: user.role, address: user.address, image: user.image, active: user.active }, accessToken, refreshToken };
};

const refreshToken = async (refreshToken) => {
  const user = await User.findOne({ refreshToken, active: true });
  if (!user) {
    throw new Error('Invalid refresh token');
  }

  const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
  return { accessToken };
};

// const getUsers = async () => {
//   return await User.find().select('-password -refreshToken').lean();
// };

const getUsers = async ({ page = 1, limit = 10, search = '', role = '', active = '', sort = '-createdAt' }) => {
  const query = {};
  if (search) {
    query.$or = [
      { fullName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  if (role) query.role = role;
  if (active !== '') query.active = active;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(query)
      .select('-password -refreshToken')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query),
  ]);

  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};

const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password -refreshToken').lean();
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

const updateUser = async (userId, updates) => {
  const allowedFields = ["fullName", "email", "phone", "password", "address", "image", "active", "role"];
  const updateData = {};

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      updateData[key] =
        key === "password" ? await bcrypt.hash(updates[key], 10) : updates[key];
    }
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { ...updateData, updatedAt: Date.now() } },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!user) throw new Error("User not found");

  return user;
};

const deleteUser = async (userId) => {
  // 1️⃣ Tìm user
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // 2️⃣ Lấy tất cả vehicle của user
  const vehicles = await Vehicle.find({ owner: user._id });

  // 3️⃣ Lấy toàn bộ simulation liên quan (theo userId và các vehicle)
  const simulations = await Simulation.find({
    $or: [
      { userId: user._id },
      { vehicleId: { $in: vehicles.map(v => v._id) } }
    ]
  });

  // 4️⃣ Xóa dữ liệu liên quan
  await Promise.all([
    SensorData.deleteMany({
      $or: [
        { userId: user._id },
        { vehicleId: { $in: vehicles.map(v => v._id) } }
      ]
    }),
    Alert.deleteMany({
      $or: [
        { userId: user._id },
        { vehicleId: { $in: vehicles.map(v => v._id) } }
      ]
    }),
    Simulation.deleteMany({
      $or: [
        { userId: user._id },
        { vehicleId: { $in: vehicles.map(v => v._id) } }
      ]
    }),
    Vehicle.deleteMany({ owner: user._id }),
  ]);

  // 5️⃣ Xóa file của từng simulation (nếu có)
  for (const sim of simulations) {
    if (sim.filepath) await deleteFileSafe(sim.filepath);
    if (sim.videoUrl) await deleteFileSafe(sim.videoUrl);
  }

  // 6️⃣ Cuối cùng xóa user
  await User.findByIdAndDelete(user._id);

  return { message: 'User and all related data/files deleted' };
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