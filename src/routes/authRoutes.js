import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validate } from "../middlewares/validate.js";
import { protect } from "../middlewares/auth.js";
import { loginLimiter, secretNameLimiter } from "../middlewares/rateLimit.js";
import {
  registerSchema,
  loginSchema,
  verifySecretNameSchema,
  resetPasswordSchema,
  setSecretNameSchema,
  updateProfileSchema,
} from "../validators/authValidators.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login", loginLimiter, validate({ body: loginSchema }), authController.login);
router.post("/logout", authController.logout);

router.get("/me", protect, authController.me);
router.patch("/me", protect, validate({ body: updateProfileSchema }), authController.updateProfile);
router.patch("/me/secret-name", protect, validate({ body: setSecretNameSchema }), authController.setSecretName);

router.post(
  "/password-reset/verify-secret-name",
  secretNameLimiter,
  validate({ body: verifySecretNameSchema }),
  authController.verifySecretName
);
router.post(
  "/password-reset/confirm",
  validate({ body: resetPasswordSchema }),
  authController.confirmPasswordReset
);

export default router;