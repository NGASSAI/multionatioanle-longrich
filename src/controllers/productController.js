import * as productService from "../services/productService.js";
import * as activityLogService from "../services/activityLogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getProducts = asyncHandler(async (req, res) => {
  const includeInactive = req.user?.role === "admin" || req.user?.role === "super_admin";
  const result = await productService.getAllProducts({ ...req.query, includeInactive });
  res.json({ success: true, data: result });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getProductBySlug(req.params.slug);
  res.json({ success: true, data: { product } });
});

export const createProduct = asyncHandler(async (req, res) => {
  // req.files vient de upload.array("images", 8) : chaque fichier est deja
  // uploade sur Cloudinary a ce stade, file.path est l'URL Cloudinary complete.
  const images = (req.files || []).map((file) => ({ path: file.path }));

  const product = await productService.createProduct({ ...req.body, images });
  res.status(201).json({ success: true, data: { product } });
});

export const updateProduct = asyncHandler(async (req, res) => {
  // Si aucune nouvelle image n'est envoyee, on ne touche pas aux images
  // existantes (voir productService.updateProduct : images est optionnel).
  const data = { ...req.body };
  if (req.files && req.files.length > 0) {
    data.images = req.files.map((file) => ({ path: file.path }));
  }

  const product = await productService.updateProduct(req.params.id, data);
  res.json({ success: true, data: { product } });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const productToDelete = await productService.getProductByIdRaw(req.params.id);

  await productService.deleteProduct(req.params.id);

  await activityLogService.logActivity({
    userId: req.user.id,
    action: "product.delete",
    description: `Suppression du produit "${productToDelete?.name ?? req.params.id}"`,
    ipAddress: req.ip,
  });

  res.json({ success: true, data: null });
});