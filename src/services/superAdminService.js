import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashValue } from "../utils/hashing.js";

// Liste des comptes ADMIN uniquement (jamais les clients, jamais les super_admin
// eux-memes pour eviter qu'un super admin se bloque ou se retire ses droits par erreur).
export const getAdminAccounts = async () => {
  return prisma.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// Creation d'un nouveau compte admin par le Super Admin.
export const createAdminAccount = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw AppError.conflict("Un compte existe deja avec cet email", "EMAIL_TAKEN");
  }

  const passwordHash = await hashValue(password);

  return prisma.user.create({
    data: { name, email, passwordHash, role: "admin" },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  });
};

// Bloquer/debloquer un compte admin. Ne touche jamais a un compte client ou super_admin.
export const updateAdminStatus = async (adminId, status) => {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) throw AppError.notFound("Compte admin introuvable");
  if (admin.role !== "admin") {
    throw AppError.forbidden("Cette route ne permet de gerer que des comptes admin", "FORBIDDEN_TARGET");
  }

  return prisma.user.update({
    where: { id: adminId },
    data: {
      status,
      // Revoque immediatement toute session active si on bloque le compte
      ...(status === "blocked" ? { tokenVersion: { increment: 1 } } : {}),
    },
    select: { id: true, name: true, email: true, status: true },
  });
};

// Suppression definitive d'un compte admin.
export const deleteAdminAccount = async (adminId) => {
  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) throw AppError.notFound("Compte admin introuvable");
  if (admin.role !== "admin") {
    throw AppError.forbidden("Cette route ne permet de supprimer que des comptes admin", "FORBIDDEN_TARGET");
  }

  await prisma.user.delete({ where: { id: adminId } });
};