import { Router } from "express";
import * as superAdminController from "../controllers/superAdminController.js";
import * as activityLogController from "../controllers/activityLogController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createAdminAccountSchema,
  updateAdminStatusSchema,
} from "../validators/superAdminValidators.js";

const router = Router();

// Toutes les routes de ce fichier sont reservees au Super Admin.
// Aucune donnee metier (produits/commandes/clients) ici — uniquement la
// gestion des comptes admin et le monitoring, conformement au cahier des charges.
router.use(protect, restrictTo("super_admin"));

router.get("/admins", superAdminController.getAdminAccounts);
router.post("/admins", validate({ body: createAdminAccountSchema }), superAdminController.createAdminAccount);
router.patch(
  "/admins/:id/status",
  validate({ body: updateAdminStatusSchema }),
  superAdminController.updateAdminStatus
);
router.delete("/admins/:id", superAdminController.deleteAdminAccount);

// Logs d'activite (audit des actions sensibles)
router.get("/activity-logs", activityLogController.getActivityLogs);

export default router;