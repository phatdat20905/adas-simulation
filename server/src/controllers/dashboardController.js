import * as dashboardService from "../services/dashboardService.js";

const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await dashboardService.getUserDashboard(userId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getUserDashboard, getAdminDashboard };
