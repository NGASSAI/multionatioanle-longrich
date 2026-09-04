import { prisma } from "../config/prisma.js";

// Enregistre une action sensible. Ne doit jamais faire echouer l'action
// metier elle-meme si le log echoue -> l'appelant doit l'utiliser en
// "fire and forget" ou avec un try/catch qui ne remonte pas d'erreur bloquante.
export const logActivity = async ({ userId = null, action, description = null, ipAddress = null }) => {
  try {
    await prisma.activityLog.create({
      data: { userId, action, description, ipAddress },
    });
  } catch (err) {
    // Un log qui echoue ne doit jamais casser la requete principale
    console.error("Echec de l'enregistrement du log d'activite:", err.message);
  }
};

// Liste paginee des logs, plus recents en premier. Reserve au Super Admin.
export const getActivityLogs = async ({ action, userId, page = 1, limit = 30 }) => {
  const skip = (Number(page) - 1) * Number(limit);

  const where = {
    ...(action ? { action } : {}),
    ...(userId ? { userId } : {}),
  };

  const [logs, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    },
  };
};