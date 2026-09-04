import "dotenv/config";
import { z } from "zod";

// Valide les variables d'environnement au démarrage plutôt que de planter
// plus tard avec une erreur obscure au milieu d'une requête.
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLIENT_URL: z.string().url(),

  DATABASE_URL: z.string().min(1),
  DIRECT_DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16, "JWT_SECRET doit faire au moins 16 caractères"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_COOKIE_NAME: z.string().default("longrich_token"),

  PASSWORD_RESET_SESSION_MINUTES: z.coerce.number().default(10),

  LOGIN_RATE_LIMIT_MAX: z.coerce.number().default(5),
  LOGIN_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),
  SECRET_NAME_RATE_LIMIT_MAX: z.coerce.number().default(5),
  SECRET_NAME_RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().default(15),

  UPLOAD_DIR: z.string().default("uploads"),
  MAX_UPLOAD_SIZE_MB: z.coerce.number().default(5),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME manquant"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY manquant"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET manquant"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables d'environnement invalides :");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
