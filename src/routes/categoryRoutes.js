import { Router } from "express";
import * as categoryController from "../controllers/categoryController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createCategorySchema, updateCategorySchema } from "../validators/categoryValidators.js";

const router = Router();

router.get("/", categoryController.getCategories);
router.get("/:slug", categoryController.getCategoryBySlug);

// Routes réservées à l'admin
router.post(
  "/",
  protect,
  restrictTo("admin"),
  validate({ body: createCategorySchema }),
  categoryController.createCategory
);

router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  validate({ body: updateCategorySchema }),
  categoryController.updateCategory
);

router.delete("/:id", protect, restrictTo("admin"), categoryController.deleteCategory);

export default router;