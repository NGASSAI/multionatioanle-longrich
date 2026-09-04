import { z } from "zod";

export const addCommentSchema = z.object({
  comment: z.string().min(1, "Le commentaire ne peut pas être vide").max(1000, "Commentaire trop long"),
  parentId: z.string().nullable().optional(),
});