import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

// Mesure la latence reelle de la base en chronometrant une requete triviale,
// plutot que de supposer un etat "ok" sans verifier concretement la connexion.
const checkDatabase = async () => {
  const start = process.hrtime.bigint();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    return { status: "ok", latencyMs: Math.round(latencyMs * 10) / 10 };
  } catch (err) {
    return { status: "error", latencyMs: null, message: err.message };
  }
};

export const getSystemStatus = async (io) => {
  const database = await checkDatabase();
  const memoryUsage = process.memoryUsage();

  return {
    database,
    server: {
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      uptimeSeconds: Math.round(process.uptime()),
      memoryUsedMb: Math.round(memoryUsage.rss / 1024 / 1024),
    },
    realtime: {
      // Nombre de connexions Socket.IO actives : le meilleur proxy honnete
      // de charge temps reel disponible dans ce projet (pas de vraie file
      // de jobs/queue mise en place).
      connectedClients: io?.engine?.clientsCount ?? 0,
    },
  };
};