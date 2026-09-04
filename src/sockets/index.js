import { Server } from "socket.io";
import cookie from "cookie";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/prisma.js";

// L'authentification et les handlers du chat/notifications seront complétés
// avec le module Chat temps réel. Pour l'instant : mise en place du socle
// (auth au handshake, req.user attaché au socket) car c'est un prérequis
// transverse à tout ce qui touche au temps réel.
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
    // Chaque utilisateur rejoint sa propre room personnelle -> permet d'émettre
    // des notifications ciblées via io.to(`user:${userId}`) depuis n'importe quel service.
    socket.join(`user:${socket.user.id}`);

    // --- Les handlers de chat (join conversation, send message, etc.) et de
    // notifications temps réel seront ajoutés ici avec leurs modules respectifs ---
  });

  return io;
};
