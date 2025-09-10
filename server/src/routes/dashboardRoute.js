import express from "express";
import {
  getUserDashboard,
  getAdminDashboard,
} from "../controllers/dashboardController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Dashboard cho user thường
router.get("/user", auth(["user", "admin"]), getUserDashboard);

// Dashboard cho admin
router.get("/admin", auth(["admin"]), getAdminDashboard);

export default router;
