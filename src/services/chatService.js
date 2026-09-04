import { prisma } from "../config/prisma.js";
import { AppError } from "../utils/AppError.js";

// Récupère ou crée la conversation active du client
export const getOrCreateClientConversation = async (clientId) => {
  let conversation = await prisma.conversation.findFirst({
    where: { clientId, status: "open" },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true, role: true, avatar: true } } },
      },
      admin: { select: { id: true, name: true, avatar: true } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { clientId },
      include: {
        messages: true,
        admin: true,
      },
    });
  }

  return conversation;
};

// Récupère toutes les conversations côté admin
export const getAllConversations = async ({ status = "open", page = 1, limit = 20 }) => {
  const skip = (Number(page) - 1) * Number(limit);

  const [conversations, total] = await prisma.$transaction([
    prisma.conversation.findMany({
      where: status ? { status } : {},
      include: {
        client: { select: { id: true, name: true, email: true, avatar: true } },
        admin: { select: { id: true, name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.conversation.count({ where: status ? { status } : {} }),
  ]);

  return {
    conversations,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};

// Enregistrer un nouveau message
export const saveMessage = async (conversationId, senderId, { content, type = "text" }) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { client: true },
  });

  if (!conversation) throw AppError.notFound("Conversation introuvable");

  const sender = await prisma.user.findUnique({ where: { id: senderId } });
  if (!sender) throw AppError.notFound("Utilisateur introuvable");

  // Si c'est un admin qui répond et qu'aucun admin n'est attribué, on lui attribue la conversation
  let adminAssignData = {};
  if (sender.role === "admin" || sender.role === "super_admin") {
    if (!conversation.adminId) {
      adminAssignData = { adminId: senderId };
    }
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type,
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatar: true } },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        ...adminAssignData,
      },
    }),
  ]);

  return { message, conversation };
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (conversationId, userId) => {
  return prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });
};