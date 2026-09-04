import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import * as statsController from "../controllers/statsController.js";
import { protect, restrictTo } from "../middlewares/auth.js";

const router = Router();

// Dashboard business basique (CA total, commandes, produits) — reserve a l'Admin.
router.get("/stats", protect, restrictTo("admin"), adminController.getDashboardStats);

// Stats detaillees (CA par periode, meilleurs clients, produits les plus
// vendus/aimes, repartition par canal, taux de conversion) — reserve a l'Admin.
router.get("/stats/detailed", protect, restrictTo("admin"), statsController.getStats);

// Gestion des CLIENTS (pas des comptes admin) — reservee a l'Admin.
router.get("/users", protect, restrictTo("admin"), adminController.getUsers);
router.patch("/users/:id", protect, restrictTo("admin"), adminController.updateUserStatusOrRole);

export default router;