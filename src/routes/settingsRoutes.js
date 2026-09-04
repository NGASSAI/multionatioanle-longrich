import { Router } from "express";
import * as settingsController from "../controllers/settingsController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { updateSiteNameSchema } from "../validators/settingsValidators.js";

const router = Router();

// Lecture publique : le frontend en a besoin des le chargement (nom du site, logo)
router.get("/", settingsController.getSettings);

// Modification reservee au Super Admin (parametres globaux du site)
router.patch(
  "/site-name",
  protect,
  restrictTo("super_admin"),
  validate({ body: updateSiteNameSchema }),
  settingsController.updateSiteName
);

router.patch(
  "/site-logo",
  protect,
  restrictTo("super_admin"),
  upload.single("logo"),
  settingsController.updateSiteLogo
);

export default router;