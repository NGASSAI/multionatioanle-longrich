import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  description: z.string().min(5, "La description doit contenir au moins 5 caracteres"),
  // z.coerce : les champs arrivent en string via multipart/form-data (upload d'images)
  price: z.coerce.number().positive("Le prix doit etre superieur a 0"),
  stock: z.coerce.number().int().nonnegative("Le stock ne peut pas etre negatif").default(0),
  categoryId: z.string().min(1, "ID de categorie requis"),
  // Les images ne passent plus par le JSON : elles arrivent en fichiers reels
  // via req.files (voir productRoutes.js), traitees separement dans le controller.
});

export const updateProductSchema = createProductSchema.partial();

export const queryProductsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "createdAt_desc"]).optional(),
});