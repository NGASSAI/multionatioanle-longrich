import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";
import { hashValue, verifyHash } from "../utils/hashing.js";

export const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
      phone: true,
      createdAt: true,
    },
  });

  if (!user) throw AppError.notFound("Utilisateur non trouvé");
  return user;
};

export const updateProfile = async (userId, data) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.phone && { phone: data.phone }),
      ...(data.avatar && { avatar: data.avatar }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      phone: true,
    },
  });

  return updatedUser;
};

export const updatePassword = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilisateur non trouvé");

  const isPasswordValid = await verifyHash(user.password, currentPassword);
  if (!isPasswordValid) {
    throw AppError.badRequest("Le mot de passe actuel est incorrect");
  }

  const hashedPassword = await hashValue(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedPassword,
      tokenVersion: { increment: 1 },
    },
  });
};