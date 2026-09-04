import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `LNG-${dateStr}-${randomStr}`;
};

export const createOrder = async (orderData, creatorUser = null) => {
  const { items, source = "website", userId: requestedUserId, ...clientInfo } = orderData;

  // Si c'est un client connecté qui commande sur le site
  const userId = creatorUser && creatorUser.role === "client" ? creatorUser.id : requestedUserId || null;

  return prisma.$transaction(async (tx) => {
    let total = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product || !product.isActive) {
        throw AppError.badRequest(`Le produit n'est plus disponible.`);
      }

      if (product.stock < item.quantity) {
        throw AppError.badRequest(
          `Stock insuffisant pour "${product.name}". Stock disponible: ${product.stock}`
        );
      }

      // Décrémenter le stock de manière atomique
      await tx.product.update({
        where: { id: product.id },
        data: { stock: { decrement: item.quantity } },
      });

      // Choisir le prix effectif (prix promo si présent)
      const unitPrice = product.promoPrice ? product.promoPrice : product.price;
      const subtotal = Number(unitPrice) * item.quantity;
      total += subtotal;

      orderItemsToCreate.push({
        productId: product.id,
        productName: product.name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    const orderNumber = generateOrderNumber();

    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        ...clientInfo,
        source,
        total,
        items: {
          create: orderItemsToCreate,
        },
      },
      include: {
        items: true,
      },
    });

    return newOrder;
  });
};

export const getAllOrders = async ({ status, source, search, page = 1, limit = 10 }) => {
  const where = {
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(search
      ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { clientName: { contains: search, mode: "insensitive" } },
            { clientPhone: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        confirmedByAdmin: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

export const getMyOrders = async (userId) => {
  return prisma.order.findMany({
    where: { userId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
};

export const getOrderById = async (orderId, requestingUser) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: { select: { id: true, slug: true, images: true } } },
      },
      user: { select: { id: true, name: true, email: true, phone: true } },
      confirmedByAdmin: { select: { id: true, name: true } },
    },
  });

  if (!order) throw AppError.notFound("Commande introuvable");

  // Un client ne peut voir que sa propre commande
  if (requestingUser.role === "client" && order.userId !== requestingUser.id) {
    throw AppError.forbidden("Vous n'avez pas accès à cette commande");
  }

  return order;
};

export const updateOrderStatus = async (orderId, newStatus, adminId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) throw AppError.notFound("Commande introuvable");

  // Si passage à annulé et qu'elle n'était pas déjà annulée -> restitution automatique du stock
  if (newStatus === "cancelled" && order.status !== "cancelled") {
    return prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          confirmedById: adminId,
          confirmedAt: new Date(),
        },
        include: { items: true },
      });
    });
  }

  // Pour confirmation/expédition/livraison
  return prisma.order.update({
    where: { id: orderId },
    data: {
      status: newStatus,
      confirmedById: adminId,
      confirmedAt: new Date(),
    },
    include: { items: true },
  });
};

export const updatePaymentStatus = async (orderId, paymentStatus) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw AppError.notFound("Commande introuvable");

  return prisma.order.update({
    where: { id: orderId },
    data: { paymentStatus },
  });
};