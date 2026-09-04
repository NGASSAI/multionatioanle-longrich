import { Router } from "express";
import * as productController from "../controllers/productController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidators.js";

const router = Router();

router.get("/", productController.getProducts);
router.get("/:slug", productController.getProductBySlug);

// Routes d'administration des produits
router.post(
  "/",
  protect,
  restrictTo("admin"),
  validate({ body: createProductSchema }),
  productController.createProduct
);

router.patch(
  "/:id",
  protect,
  restrictTo("admin"),
  validate({ body: updateProductSchema }),
  productController.updateProduct
);

router.delete("/:id", protect, restrictTo("admin"), productController.deleteProduct);

export default router;