import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const HASH_OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

const accounts = [
  { email: "okabamariam@05gmail.com", name: "Mariam Okaba", role: "admin", passwordEnv: "SEED_ADMIN_PASSWORD" },
  { email: "nathanngassai885@gmail.com", name: "Nathan Ngassai", role: "super_admin", passwordEnv: "SEED_SUPER_ADMIN_PASSWORD" },
];

async function main() {
  for (const acc of accounts) {
    const password = process.env[acc.passwordEnv];
    if (!password) {
      throw new Error(`Variable ${acc.passwordEnv} manquante dans .env — définis-la avant de lancer le seed.`);
    }
    const passwordHash = await argon2.hash(password, HASH_OPTIONS);
    const user = await prisma.user.upsert({
      where: { email: acc.email },
      update: {},
      create: { name: acc.name, email: acc.email, role: acc.role, passwordHash },
    });
    console.log(`✅ ${acc.role} prêt : ${user.email}`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Erreur pendant le seed :", err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());