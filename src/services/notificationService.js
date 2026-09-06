import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

// Cree une notification en base ET l'emet en temps reel via Socket.IO sur la
// room personnelle de l'utilisateur (voir sockets/index.js : socket.join(`user:${id}`)).
// `io` est passe explicitement (recupere par l'appelant via req.app.get("io"))
// pour eviter tout import circulaire entre services et sockets.
export const createAndEmitNotification = async (io, { userId, type, data }) => {
  const notification = await prisma.notification.create({
    data: { userId, type, data },
  });

  io?.to(`user:${userId}`).emit("notification:new", notification);

  return notification;
};

// Liste paginee des notifications d'un utilisateur, plus recentes en premier.
export const getMyNotifications = async (userId, { page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// Marque une notification precise comme lue. Verifie qu'elle appartient
// bien a l'utilisateur (pas de fuite entre comptes).
export const markAsRead = async (userId, notificationId) => {
  const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!notification) throw AppError.notFound("Notification introuvable");
  if (notification.userId !== userId) {
    throw AppError.forbidden("Cette notification ne vous appartient pas");
  }
  if (notification.readAt) return notification;

  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
};

// "Tout marquer comme lu" (bouton explicitement demande dans le cahier des charges).
export const markAllAsRead = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
};

// --- Declencheurs metier ---------------------------------------------------

// Nouvelle commande (site ou saisie manuelle) -> notifie tous les admins actifs.
// (Le Super Admin n'a pas de donnees metier, donc pas notifie ici.)
export const notifyNewOrder = async (io, order) => {
  const admins = await prisma.user.findMany({
    where: { role: "admin", status: "active" },
    select: { id: true },
  });

  await Promise.all(
    admins.map((admin) =>
      createAndEmitNotification(io, {
        userId: admin.id,
        type: "order.new",
        data: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          source: order.source,
        },
      })
    )
  );
};

// Changement de statut de commande -> notifie le client concerne (s'il a un compte).
export const notifyOrderStatusChange = async (io, order) => {
  if (!order.userId) return; // commande passee sans compte client (whatsapp/telephone/admin)

  await createAndEmitNotification(io, {
    userId: order.userId,
    type: "order.status_changed",
    data: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
    },
  });
};

// Nouveau message de chat -> notifie l'autre participant de la conversation
// (le client si l'expediteur est un admin, l'admin assigne si l'expediteur est le client).
export const notifyNewMessage = async (io, { message, conversation }) => {
  // Message envoye par le CLIENT et aucun admin assigne : notifie tous les
  // admins actifs (comme notifyNewOrder), le premier qui repond recupere
  // l'assignation (logique deja geree dans chatService.saveMessage).
  if (message.senderId === conversation.clientId && !conversation.adminId) {
    const admins = await prisma.user.findMany({
      where: { role: "admin", status: "active" },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        createAndEmitNotification(io, {
          userId: admin.id,
          type: "chat.new_message",
          data: {
            conversationId: conversation.id,
            messagePreview: message.content.slice(0, 100),
          },
        })
      )
    );
    return;
  }

  const recipientId =
    message.senderId === conversation.clientId ? conversation.adminId : conversation.clientId;

  if (!recipientId) return;

  await createAndEmitNotification(io, {
    userId: recipientId,
    type: "chat.new_message",
    data: {
      conversationId: conversation.id,
      messagePreview: message.content.slice(0, 100),
    },
  });
};