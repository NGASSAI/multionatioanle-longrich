import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

// Récupérer les données globales du dashboard
export const getDashboardStats = async () => {
  const [totalUsers, totalOrders, totalProducts, salesAgg] = await prisma.$transaction([
    prisma.user.count({ where: { role: "client" } }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "paid" },
      _sum: { total: true }, // Correctif: 'total' au lieu de 'totalAmount'
    }),
  ]);

  const recentOrders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  return {
    totalClients: totalUsers,
    totalOrders,
    totalProducts,
    totalRevenue: salesAgg._sum.total || 0,
    recentOrders,
  };
};

// Récupérer tous les utilisateurs avec filtres et pagination
export const getUsers = async ({ search, role, status, page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(role && { role }),
    ...(status && { status }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// Modifier le statut ou rôle d'un utilisateur (Super-Admin)
export const updateUserStatusOrRole = async (userId, { status, role }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilisateur introuvable");

  const dataToUpdate = {};
  if (status) dataToUpdate.status = status;
  if (role) dataToUpdate.role = role;

  // Si l'utilisateur est bloqué, on révoque sa session ee (tokenVersion)
  if (status === "blocked") {
    dataToUpdate.tokenVersion = { increment: 1 };
  }

  return prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });
};