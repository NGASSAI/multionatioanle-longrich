import { z } from "zod";
export const createProductSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caracteres"),
  description: z.string().min(5, "La description doit contenir au moins 5 caracteres"),
  price: z.coerce.number().positive("Le prix doit etre superieur a 0"),
  promoPrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().nonnegative("Le stock ne peut pas etre negatif").default(0),
  categoryId: z.string().min(1, "ID de categorie requis"),
 isFeatured: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
isActive: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});
export const updateProductSchema = createProductSchema.partial();
export const queryProductsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "createdAt_desc"]).optional(),
});
