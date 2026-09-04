import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
  price: z.number().positive("Le prix doit être supérieur à 0"),
  stock: z.number().int().nonnegative("Le stock ne peut pas être négatif").default(0),
  categoryId: z.string().min(1, "ID de catégorie requis"),
  images: z.array(z.string().min(1, "Chemin d'image valide requis")).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const queryProductsSchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 10)),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  sortBy: z.enum(["price_asc", "price_desc", "createdAt_desc"]).optional(),
});