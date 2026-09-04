import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Le message ne peut pas être vide"),
  type: z.enum(["text", "image"]).default("text"),
});