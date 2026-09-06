import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

// Recuperer les donnees globales du dashboard
export const getDashboardStats = async () => {
  const [totalUsers, totalOrders, totalProducts, salesAgg] = await prisma.$transaction([
    prisma.user.count({ where: { role: "client" } }),
    prisma.order.count(),
    prisma.product.count(),
    prisma.order.aggregate({
      where: { paymentStatus: "paid" },
      _sum: { total: true },
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

// Recuperer les CLIENTS uniquement, avec filtres et pagination.
// Route reservee a l'Admin : ne doit jamais remonter de comptes admin/super_admin.
export const getUsers = async ({ search, status, page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    role: "client",
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
  phone: true,
  avatar: true,
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

// Bloquer/debloquer ou modifier un CLIENT (pas un compte admin).
// Empeche explicitement de toucher un compte admin/super_admin par cette route.
export const updateUserStatusOrRole = async (userId, { status }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilisateur introuvable");

  if (user.role !== "client") {
    throw AppError.forbidden(
      "Cette route ne permet de modifier que des comptes clients",
      "FORBIDDEN_TARGET"
    );
  }

  const dataToUpdate = {};
  if (status) dataToUpdate.status = status;

  // Si l'utilisateur est bloque, on revoque sa session active (tokenVersion)
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
export const deleteUser = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("Utilisateur introuvable");
  if (user.role !== "client") {
    throw AppError.forbidden(
      "Cette route ne permet de supprimer que des comptes clients",
      "FORBIDDEN_TARGET"
    );
  }
  await prisma.user.delete({ where: { id: userId } });
  return user;
};  