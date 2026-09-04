// Prisma 7 : la CLI (generate/migrate/studio) lit sa configuration ici,
// plus dans schema.prisma. Pour les migrations, on utilise volontairement
// la connexion DIRECTE à Neon (DIRECT_DATABASE_URL) : la connexion poolée
// (pgbouncer) ne supporte pas les migrations. Le client applicatif, lui,
// utilise la connexion poolée via le driver adapter (voir src/config/prisma.js).
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL,
  },
});
