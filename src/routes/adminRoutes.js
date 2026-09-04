import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = Router();

// Dashboard réservé aux Admins & Super-Admins
router.get("/stats", protect, restrictTo("admin", "super_admin"), adminController.getDashboardStats);

// Gestion des utilisateurs réservée au Super-Admin
router.get("/users", protect, restrictTo("super_admin"), adminController.getUsers);
router.patch("/users/:id", protect, restrictTo("super_admin"), adminController.updateUserStatusOrRole);

export default router;