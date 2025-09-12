// services/dashboardService.js
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Simulation from "../models/Simulation.js";
import Alert from "../models/Alert.js";

/**
 * Dashboard cho user thường
 */
const getUserDashboard = async (userId) => {
  // Tổng hợp số liệu cơ bản
  const [myVideos, mySimulations, myAlerts] = await Promise.all([
    Simulation.countDocuments({ userId, fileType: "video" }),
    Simulation.countDocuments({ userId, status: "completed" }),
    Alert.countDocuments({ userId }),
  ]);

  // Thống kê alerts theo loại
  const alertsByTypeAgg = await Alert.aggregate([
    { $match: { userId } },
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const alertsByType = alertsByTypeAgg.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  // Xu hướng simulation trong 7 ngày gần đây
  const trend7days = await Simulation.aggregate([
    {
      $match: {
        userId,
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 5 simulation gần nhất
  const recentSimulations = await Simulation.find({ userId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    myVideos,
    mySimulations,
    myAlerts,
    alertsByType,
    trend7days,
    recentSimulations,
  };
};

/**
 * Dashboard cho admin
 */
const getAdminDashboard = async () => {
  // Tổng hợp số liệu cơ bản
  const [totalUsers, totalVehicles, totalVideos, totalSimulations] =
    await Promise.all([
      User.countDocuments(),
      Vehicle.countDocuments(),
      Simulation.countDocuments({ fileType: "video" }),
      Simulation.countDocuments(),
    ]);

  // Thống kê status
  const statusDistribution = await Simulation.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);

  // Thống kê alerts theo loại
  const alertsByTypeAgg = await Alert.aggregate([
    { $group: { _id: "$type", count: { $sum: 1 } } },
  ]);
  const alertsByType = alertsByTypeAgg.reduce((acc, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});

  // Top 5 user hoạt động nhiều nhất
  const topUsers = await Simulation.aggregate([
    { $group: { _id: "$userId", simulations: { $sum: 1 } } },
    { $sort: { simulations: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        userId: "$_id",
        fullName: "$user.fullName",
        simulations: 1,
      },
    },
  ]);

  // Xu hướng simulation trong 30 ngày
  const trend30days = await Simulation.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // 5 simulation gần nhất
  const recentSimulations = await Simulation.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return {
    totalUsers,
    totalVehicles,
    totalVideos,
    totalSimulations,
    statusDistribution,
    alertsByType,
    topUsers,
    trend30days,
    recentSimulations,
  };
};

export { getUserDashboard, getAdminDashboard };
