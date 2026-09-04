import { Router } from "express";
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import productRoutes from "./productRoutes.js";
import interactionRoutes from "./interactionRoutes.js";
import orderRoutes from "./orderRoutes.js";
import chatRoutes from "./chatRoutes.js";
import adminRoutes from "./adminRoutes.js";

const router = Router();

// Route de santé pour Render (health check)
router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// Routes métier
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/interactions", interactionRoutes);
router.use("/orders", orderRoutes);

// --- Prochains modules à activer plus tard ---
// router.use("/users", userRoutes);
router.use("/users", userRoutes);
// router.use("/conversations", conversationRoutes);
router.use("/conversations", chatRoutes);
// router.use("/notifications", notificationRoutes);
// router.use("/stats", statsRoutes);
// router.use("/settings", settingsRoutes);
// router.use("/super-admin", superAdminRoutes);
router.use("/admin", adminRoutes);

export default router;