import express from "express";
import { createSupport, getSupports, updateSupport, deleteSupport } from "../controllers/supportController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// Khách hàng gửi yêu cầu không cần đăng nhập
router.post("/", createSupport);

// Admin quản lý
router.get("/", auth(["admin"]), getSupports);
router.put("/:id", auth(["admin"]), updateSupport);
router.delete("/:id", auth(["admin"]), deleteSupport);

export default router;
