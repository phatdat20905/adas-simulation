import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Simulation from "../models/Simulation.js";
import Alert from "../models/Alert.js";

const getUserDashboard = async (userId) => {
  const [myVideos, mySimulations, myAlerts, recentSimulations] =
    await Promise.all([
      Simulation.countDocuments({ userId }),
      Simulation.countDocuments({ userId }),
      Alert.countDocuments({ userId }),
      Simulation.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

  return {
    myVideos,
    mySimulations,
    myAlerts,
    recentSimulations,
  };
};

const getAdminDashboard = async () => {
  const [totalUsers, totalVehicles, totalVideos, totalSimulations] =
    await Promise.all([
      User.countDocuments(),
      Vehicle.countDocuments(),
      Simulation.countDocuments(),
      Simulation.countDocuments(),
    ]);

  const statusDistribution = await Simulation.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { status: "$_id", count: 1, _id: 0 } },
  ]);

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
    recentSimulations,
  };
};

export { getUserDashboard, getAdminDashboard };
