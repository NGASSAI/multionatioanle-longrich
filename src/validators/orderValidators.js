import { z } from "zod";

const orderItemSchema = z.object({
  productId: z.string().min(1, "L'ID du produit est requis"),
  quantity: z.number().int().positive("La quantité doit être supérieure à 0"),
});

export const createOrderSchema = z.object({
  userId: z.string().optional(),
  clientName: z.string().min(2, "Le nom du client est requis"),
  clientPhone: z.string().min(8, "Numéro de téléphone invalide"),
  clientAddress: z.string().optional(),
  items: z.array(orderItemSchema).min(1, "La commande doit contenir au moins un article"),
  notes: z.string().optional(),
  source: z.enum(["website", "whatsapp", "phone_call", "admin"]).default("website"),
  paymentStatus: z.enum(["unpaid", "paid"]).default("unpaid"),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled"]),
});

export const updatePaymentStatusSchema = z.object({
  paymentStatus: z.enum(["unpaid", "paid"]),
});