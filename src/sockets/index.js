import { Server } from "socket.io";
import cookie from "cookie";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";
import * as chatService from "../services/chatService.js";
import * as notificationService from "../services/notificationService.js";

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie;
      const parsed = rawCookies ? cookie.parse(rawCookies) : {};
      const token = parsed[env.JWT_COOKIE_NAME];
      if (!token) return next(new Error("UNAUTHORIZED"));
      const payload = verifyToken(token);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.status === "blocked" || user.tokenVersion !== payload.tokenVersion) {
        return next(new Error("UNAUTHORIZED"));
      }
      socket.user = user;
      next();
    } catch {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.user.id}`);

    // Rejoint la room d'une conversation — verification stricte des droits :
    // seul le client concerne ou un admin/super_admin peut y entrer (cahier
    // des charges section 4 : "seul le client concerne et les admins peuvent
    // rejoindre une conversation donnee").
    socket.on("join_conversation", async (conversationId, callback) => {
      try {
        const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
        if (!conversation) return callback?.({ error: "Conversation introuvable" });

        const isOwner = conversation.clientId === socket.user.id;
        const isStaff = socket.user.role === "admin" || socket.user.role === "super_admin";
        if (!isOwner && !isStaff) {
          return callback?.({ error: "Acces refuse a cette conversation" });
        }

        socket.join(`conversation:${conversationId}`);
        callback?.({ success: true });
      } catch {
        callback?.({ error: "Erreur lors de la connexion a la conversation" });
      }
    });

    socket.on("leave_conversation", (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Envoi d'un message — reutilise chatService.saveMessage (meme logique
    // que la route REST POST /conversations/:id/messages), puis diffuse a
    // tous les participants deja dans la room et notifie le destinataire absent.
    socket.on("send_message", async ({ conversationId, content, type = "text" }, callback) => {
      try {
        const result = await chatService.saveMessage(conversationId, socket.user.id, { content, type });

        io.to(`conversation:${conversationId}`).emit("message:new", result.message);
        await notificationService.notifyNewMessage(io, result);

        callback?.({ success: true, message: result.message });
      } catch (err) {
        callback?.({ error: err.message || "Erreur lors de l'envoi du message" });
      }
    });

    // Marque les messages comme lus et informe l'autre participant (utile
    // pour un indicateur "vu" cote expediteur).
    socket.on("mark_read", async (conversationId) => {
      try {
        await chatService.markMessagesAsRead(conversationId, socket.user.id);
        socket.to(`conversation:${conversationId}`).emit("messages:read", {
          conversationId,
          readBy: socket.user.id,
        });
      } catch {
        // Echec silencieux : pas critique, l'utilisateur peut rouvrir la conversation.
      }
    });
  });

  return io;
};