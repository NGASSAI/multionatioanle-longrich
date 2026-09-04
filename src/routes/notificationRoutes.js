import { Router } from "express";
import * as notificationController from "../controllers/notificationController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

// Toutes les routes de notifications necessitent d'etre connecte.
// Chaque utilisateur (client, admin, super_admin) ne voit que les siennes
// (filtre par req.user.id dans le service, jamais par un id fourni en query).
router.use(protect);

router.get("/", notificationController.getMyNotifications);
router.patch("/:id/read", notificationController.markAsRead);
router.patch("/read-all", notificationController.markAllAsRead);

export default router;