import http from "node:http";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/prisma.js";
import { initSocket } from "./sockets/index.js";

const httpServer = http.createServer(app);
export const io = initSocket(httpServer);

// Rend io accessible depuis les controllers via req.app.get("io") sans import circulaire
app.set("io", io);

httpServer.listen(env.PORT, () => {
  console.log(`✅ API Longrich démarrée sur le port ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = async (signal) => {
  console.log(`\n${signal} reçu, arrêt en cours...`);
  httpServer.close(async () => {
    await prisma.$disconnect();
    console.log("Arrêt propre terminé.");
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
