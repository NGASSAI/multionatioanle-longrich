import { z } from "zod";

export const updateSiteNameSchema = z.object({
  siteName: z.string().min(2).max(100),
});