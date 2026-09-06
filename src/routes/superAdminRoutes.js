import { Router } from "express";
import * as superAdminController from "../controllers/superAdminController.js";
import * as activityLogController from "../controllers/activityLogController.js";
import * as monitoringController from "../controllers/monitoringController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createAdminAccountSchema,
  updateAdminStatusSchema,
} from "../validators/superAdminValidators.js";

const router = Router();

router.use(protect, restrictTo("super_admin"));

router.get("/monitoring", monitoringController.getSystemStatus);

router.get("/admins", superAdminController.getAdminAccounts);
router.post("/admins", validate({ body: createAdminAccountSchema }), superAdminController.createAdminAccount);
router.patch(
  "/admins/:id/status",
  validate({ body: updateAdminStatusSchema }),
  superAdminController.updateAdminStatus
);
router.delete("/admins/:id", superAdminController.deleteAdminAccount);

router.get("/activity-logs", activityLogController.getActivityLogs);

export default router;