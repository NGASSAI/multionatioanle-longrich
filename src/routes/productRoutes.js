import { Router } from "express";
import * as productController from "../controllers/productController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { upload } from "../middlewares/upload.js";
import { createProductSchema, updateProductSchema } from "../validators/productValidators.js";

const router = Router();

router.get("/", productController.getProducts);
router.get("/:slug", productController.getProductBySlug);

// Routes d'administration des produits.
// upload.array("images", 8) : jusqu'a 8 images par produit, envoyees en
// multipart/form-data sous le champ "images" -> disponibles dans req.files.
// Doit passer AVANT validate() : sinon req.body n'est pas encore rempli par
// multer au moment ou Zod essaie de le valider (multipart parse le body en
// meme temps que les fichiers).
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