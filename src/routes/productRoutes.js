import { Router } from "express";
import * as productController from "../controllers/productController.js";
import { protect, restrictTo, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidators.js";

const router = Router();

router.get("/", optionalAuth, productController.getProducts);
router.get("/:slug", optionalAuth, productController.getProductBySlug);

router.post(
  "/",
  protect,
  restrictTo("admin"),
  upload.array("images", 8),
  validate({ body: createProductSchema }),
  productController.createProduct
);

router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  upload.array("images", 8),
  validate({ body: updateProductSchema }),
  productController.updateProduct
);

router.delete("/:id", protect, restrictTo("admin"), productController.deleteProduct);

export default router;