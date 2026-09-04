import jwt from "jsonwebtoken";
import { env, isProd } from "../config/env.js";

// Le payload embarque tokenVersion : si l'utilisateur change son mot de passe,
// on incrémente User.tokenVersion en base, ce qui invalide immédiatement
// tous les anciens tokens (comparaison faite dans middlewares/auth.js).
export const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role, tokenVersion: user.tokenVersion },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

export const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

const cookieOptions = {
  httpOnly: true,
  secure: isProd, // HTTPS uniquement en production
  sameSite: isProd ? "none" : "lax", // "none" nécessaire si frontend/backend sur domaines différents en prod
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours, doit rester cohérent avec JWT_EXPIRES_IN
};

export const setAuthCookie = (res, token) => {
  res.cookie(env.JWT_COOKIE_NAME, token, cookieOptions);
};

export const clearAuthCookie = (res) => {
  res.clearCookie(env.JWT_COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
};
