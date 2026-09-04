import { prisma } from "../config/prisma.js";

// Chiffre d'affaires total et sur une periode donnee (optionnelle).
// Ne compte que les commandes payees, coherent avec le dashboard existant.
// Deux requetes independantes -> pas de $transaction necessaire ici.
export const getRevenue = async ({ from, to } = {}) => {
  const dateFilter =
    from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {};

  const totalAgg = await prisma.order.aggregate({
    where: { paymentStatus: "paid" },
    _sum: { total: true },
  });

  const periodAgg = await prisma.order.aggregate({
    where: { paymentStatus: "paid", ...dateFilter },
    _sum: { total: true },
    _count: true,
  });

  return {
    totalRevenue: totalAgg._sum.total || 0,
    periodRevenue: periodAgg._sum.total || 0,
    periodOrderCount: periodAgg._count,
  };
};

// Clients qui achetent le plus : montant total depense + nombre de commandes.
export const getTopClients = async (limit = 10) => {
  const grouped = await prisma.order.groupBy({
    by: ["userId"],
    where: { userId: { not: null }, paymentStatus: "paid" },
    _sum: { total: true },
    _count: true,
    orderBy: { _sum: { total: "desc" } },
    take: Number(limit),
  });

  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return grouped.map((g) => ({
    user: userMap[g.userId] || null,
    totalSpent: g._sum.total || 0,
    orderCount: g._count,
  }));
};

// Produits les plus vendus (quantite cumulee via OrderItem).
export const getTopSellingProducts = async (limit = 10) => {
  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { productId: { not: null } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: Number(limit),
  });

  const productIds = grouped.map((g) => g.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, slug: true, price: true },
  });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  return grouped.map((g) => ({
    product: productMap[g.productId] || null,
    quantitySold: g._sum.quantity || 0,
  }));
};

// Produits les plus aimes (compteur denormalise likesCount).
export const getMostLikedProducts = async (limit = 10) => {
  return prisma.product.findMany({
    orderBy: { likesCount: "desc" },
    take: Number(limit),
    select: { id: true, name: true, slug: true, likesCount: true },
  });
};

// Repartition des commandes par canal (website/whatsapp/phone_call/admin).
export const getOrdersByChannel = async () => {
  const grouped = await prisma.order.groupBy({
    by: ["source"],
    _count: true,
  });

  return grouped.map((g) => ({ source: g.source, count: g._count }));
};

// Taux de conversion approximatif : commandes / vues produits cumulees.
export const getConversionRate = async () => {
  const totalOrders = await prisma.order.count();
  const viewsAgg = await prisma.product.aggregate({ _sum: { viewsCount: true } });

  const totalViews = viewsAgg._sum.viewsCount || 0;
  const conversionRate = totalViews > 0 ? (totalOrders / totalViews) * 100 : 0;

  return {
    totalOrders,
    totalViews,
    conversionRate: Math.round(conversionRate * 100) / 100,
  };
};