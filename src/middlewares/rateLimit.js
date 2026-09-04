import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Combine IP + email comme clé, conformément au cahier des charges
// ("5 tentatives par email+IP") : empêche un attaquant de bloquer un
// utilisateur légitime en épuisant le quota via son seul email.
const emailPlusIpKey = (req) => {
  const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "no-email";
  return `${req.ip}:${email}`;
};

const tooManyHandler = (req, res, next) => next(AppError.tooMany());

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