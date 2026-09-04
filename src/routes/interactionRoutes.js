import { Router } from "express";
import * as interactionController from "../controllers/interactionController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { addCommentSchema } from "../validators/interactionValidators.js";

const router = Router();

// Routes client (authentifié)
router.post("/products/:productId/like", protect, interactionController.toggleLike);
router.post(
  "/products/:productId/comments",
  protect,
  validate({ body: addCommentSchema }),
  interactionController.addComment
);

// Routes de modération Admin
router.patch(
  "/comments/:id/moderate",
  protect,
  restrictTo("admin"),
  interactionController.moderateComment
);

router.delete(
  "/comments/:id",
  protect,
  restrictTo("admin"),
  interactionController.deleteComment
);

export default router;