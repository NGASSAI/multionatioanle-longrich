import { z } from "zod";

export const createAdminAccountSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(72),
});

export const updateAdminStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
});