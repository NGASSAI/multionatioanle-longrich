import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const emailPlusIpKey = (req) => {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "no-email";
  return `${req.ip}:${email}`;
};

// Le handler recoit resetTime via req.rateLimit (fourni par express-rate-limit)
// pour calculer le temps d'attente restant en secondes, transmis au frontend
// afin d'afficher un vrai compte a rebours plutot qu'un message generique.
const tooManyHandler = (req, res, next) => {
  const resetTime = req.rateLimit?.resetTime;
  const retryAfterSeconds = resetTime
    ? Math.max(1, Math.ceil((new Date(resetTime).getTime() - Date.now()) / 1000))
    : null;

  const error = AppError.tooMany();
  error.details = { retryAfterSeconds };
  next(error);
};

export const loginLimiter = rateLimit({
  windowMs: env.LOGIN_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.LOGIN_RATE_LIMIT_MAX,
  keyGenerator: emailPlusIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyHandler,
});

export const secretNameLimiter = rateLimit({
  windowMs: env.SECRET_NAME_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: env.SECRET_NAME_RATE_LIMIT_MAX,
  keyGenerator: emailPlusIpKey,
  standardHeaders: true,
  legacyHeaders: false,
  handler: tooManyHandler,
});