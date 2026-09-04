import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isProd } from "./env.js";

// Prisma 7 : plus de moteur Rust intégré, le client a besoin d'un driver
// adapter explicite. Ici on utilise la connexion POOLÉE (pgbouncer côté Neon)
// pour l'application — la connexion directe (DIRECT_DATABASE_URL) est réservée
// aux migrations, configurées séparément dans prisma.config.js.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

// Singleton pour éviter d'ouvrir une nouvelle connexion à chaque hot-reload en dev
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: isProd ? ["error", "warn"] : ["error", "warn"],
  });

if (!isProd) {
  globalForPrisma.prisma = prisma;
}
