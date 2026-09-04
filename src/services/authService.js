import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashValue, verifyHash, generateResetToken, hashResetToken } from "../utils/hashing.js";
import { env } from "../config/env.js";

export const registerUser = async ({ name, email, phone, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw AppError.conflict("Un compte existe déjà avec cet email", "EMAIL_TAKEN");
  }
  const passwordHash = await hashValue(password);
  return prisma.user.create({ data: { name, email, phone, passwordHash } });
};

export const authenticateUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Message générique volontaire : ne révèle jamais si c'est l'email ou le
  // mot de passe qui est incorrect (anti-énumération de comptes).
  if (!user) throw AppError.unauthorized("Email ou mot de passe incorrect", "INVALID_CREDENTIALS");

  const validPassword = await verifyHash(user.passwordHash, password);
  if (!validPassword) throw AppError.unauthorized("Email ou mot de passe incorrect", "INVALID_CREDENTIALS");

  if (user.status === "blocked") throw AppError.forbidden("Ce compte est bloqué", "ACCOUNT_BLOCKED");

  return user;
};

export const setSecretName = async (userId, { currentPassword, secretName }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilisateur introuvable");

  const validPassword = await verifyHash(user.passwordHash, currentPassword);
  if (!validPassword) throw AppError.unauthorized("Mot de passe actuel incorrect", "INVALID_CREDENTIALS");

  const secretNameHash = await hashValue(secretName);
  return prisma.user.update({
    where: { id: userId },
    data: { secretNameHash, secretNameSetAt: new Date() },
  });
};

export const updateProfile = (userId, data) =>
  prisma.user.update({ where: { id: userId }, data });

// --- Reset de mot de passe sans email (cahier des charges section 3) ---

// Étape 2 : vérifie email + nom secret, crée une session de reset (10 min).
// Ne révèle jamais si c'est l'email ou le nom secret qui est faux, ni si le
// compte a défini un nom secret.
export const verifySecretNameAndCreateSession = async ({ email, secretName }) => {
  const genericError = () =>
    AppError.unauthorized("Email ou nom secret incorrect", "INVALID_SECRET_NAME");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.secretNameHash) throw genericError();

  const validSecretName = await verifyHash(user.secretNameHash, secretName);
  if (!validSecretName) throw genericError();

  if (user.status === "blocked") throw AppError.forbidden("Ce compte est bloqué", "ACCOUNT_BLOCKED");

  const { rawToken, tokenHash } = generateResetToken();
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_SESSION_MINUTES * 60 * 1000);

  await prisma.passwordResetSession.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  return { rawToken, expiresAt };
};

// Étape 3 : consomme la session de reset et change le mot de passe.
// Bloque toute tentative sans session valide (absente/expirée/déjà utilisée).
export const resetPasswordWithSession = async (rawToken, newPassword) => {
  if (!rawToken) {
    throw AppError.unauthorized("Session de réinitialisation invalide ou expirée", "INVALID_RESET_SESSION");
  }

  const tokenHash = hashResetToken(rawToken);
  const session = await prisma.passwordResetSession.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });

  if (!session) {
    throw AppError.unauthorized("Session de réinitialisation invalide ou expirée", "INVALID_RESET_SESSION");
  }

  const newPasswordHash = await hashValue(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.userId },
      data: { passwordHash: newPasswordHash, tokenVersion: { increment: 1 } }, // invalide tous les JWT actifs
    }),
    prisma.passwordResetSession.update({
      where: { id: session.id },
      data: { usedAt: new Date() },
    }),
    // Invalide aussi toute autre session de reset non utilisée pour ce user
    prisma.passwordResetSession.updateMany({
      where: { userId: session.userId, usedAt: null, id: { not: session.id } },
      data: { usedAt: new Date() },
    }),
  ]);
};