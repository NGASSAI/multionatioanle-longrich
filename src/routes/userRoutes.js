import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { protect } from "../middlewares/auth.js";

const router = Router();

router.use(protect); // Toutes les routes ici nécessitent d'être connecté

router.get("/me", userController.getMe);
router.patch("/me", userController.updateMe);
router.patch("/me/password", userController.updateMyPassword);

export default router;