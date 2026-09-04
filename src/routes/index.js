import { Router } from "express";
import authRoutes from "./authRoutes.js";
const router = Router();

// Route de santé pour Render (health check) et pour vérifier rapidement que l'API tourne
router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

// --- Les routes métier seront montées ici au fur et à mesure ---

// router.use("/auth", authRoutes);

router.get("/health", (req, res) => {
  res.json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

router.use("/auth", authRoutes);
// router.use("/users", userRoutes);
// router.use("/categories", categoryRoutes);
// router.use("/products", productRoutes);
// router.use("/orders", orderRoutes);
// router.use("/conversations", conversationRoutes);
// router.use("/notifications", notificationRoutes);
// router.use("/stats", statsRoutes);
// router.use("/settings", settingsRoutes);
// router.use("/super-admin", superAdminRoutes);

export default router;
