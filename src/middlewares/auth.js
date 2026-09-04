import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Vérifie le JWT (cookie httpOnly en priorité, header Authorization en fallback
// pour d'éventuels clients non-navigateur), recharge l'utilisateur depuis la base
// (pas seulement le payload du token) pour vérifier son statut et sa tokenVersion
// à jour, et l'attache à req.user.
export const protect = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = req.cookies?.[env.JWT_COOKIE_NAME] || bearer;

  if (!token) {
    throw AppError.unauthorized("Authentification requise");
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw AppError.unauthorized("Session invalide ou expirée", "INVALID_TOKEN");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });

  if (!user) {
    throw AppError.unauthorized("Utilisateur introuvable", "INVALID_TOKEN");
  }
  if (user.status === "blocked") {
    throw AppError.forbidden("Ce compte est bloqué", "ACCOUNT_BLOCKED");
  }
  // Un changement de mot de passe incrémente tokenVersion : tout token émis
  // avant ce changement devient automatiquement invalide.
  if (user.tokenVersion !== payload.tokenVersion) {
    throw AppError.unauthorized("Session expirée, reconnectez-vous", "INVALID_TOKEN");
  }

  req.user = user;
  next();
});

// Autorise uniquement les rôles listés. Usage : restrictTo("admin", "super_admin")
export const restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(AppError.forbidden("Vous n'avez pas les droits pour cette action"));
    }
    next();
  };

// Pour les routes accessibles à tous mais dont le comportement change si connecté
// (ex. savoir si l'utilisateur courant a liké un produit, ou permettre une commande
// invité tout en reconnaissant un client déjà authentifié) : n'échoue jamais,
// attache req.user seulement si un token valide est présent.
export const attachUserIfPresent = asyncHandler(async (req, res, next) => {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : null;
  const token = req.cookies?.[env.JWT_COOKIE_NAME] || bearer;
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (user && user.status === "active" && user.tokenVersion === payload.tokenVersion) {
      req.user = user;
    }
  } catch {
    // token invalide -> on continue simplement sans req.user
  }
  next();
});

// Alias : orderRoutes.js utilise ce nom pour les commandes passées par un
// client invité (non connecté) tout en reconnaissant un client déjà authentifié.
export const optionalAuth = attachUserIfPresent;