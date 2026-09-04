import { Router } from "express";
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import categoryRoutes from "./categoryRoutes.js";
import productRoutes from "./productRoutes.js";
import interactionRoutes from "./interactionRoutes.js";
import orderRoutes from "./orderRoutes.js";
import chatRoutes from "./chatRoutes.js";
import adminRoutes from "./adminRoutes.js";
import superAdminRoutes from "./superAdminRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import settingsRoutes from "./settingsRoutes.js";

const router = Router();

// Route de sante pour Render (health check)
router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// Routes metier
router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/interactions", interactionRoutes);
router.use("/orders", orderRoutes);
router.use("/users", userRoutes);
router.use("/conversations", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/settings", settingsRoutes);

// Admin (business : produits/commandes/clients/stats) — restrictTo("admin")
router.use("/admin", adminRoutes);

// Super Admin (comptes admin uniquement, aucune donnee metier) — restrictTo("super_admin")
router.use("/super-admin", superAdminRoutes);

export default router;