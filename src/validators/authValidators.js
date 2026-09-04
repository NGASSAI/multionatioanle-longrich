import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().toLowerCase(),
  phone: z.string().min(6).max(20).optional(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

export const verifySecretNameSchema = z.object({
  email: z.string().email().toLowerCase(),
  secretName: z.string().min(1),
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

export const setSecretNameSchema = z.object({
  currentPassword: z.string().min(1),
  secretName: z.string().min(4).max(100),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(6).max(20).optional().nullable(),
  avatar: z.string().url().optional().nullable(),
});