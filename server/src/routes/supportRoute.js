// routes/supportRoutes.js
import express from "express";
import { createSupport, getSupports, updateSupport, deleteSupport } from "../controllers/supportController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/", createSupport); // khách hàng gửi không cần auth
router.get("/", auth(["admin"]), getSupports); // admin quản lý
router.put("/:id", auth(["admin"]), updateSupport);
router.delete("/:id", auth(["admin"]), deleteSupport);

export default router;
