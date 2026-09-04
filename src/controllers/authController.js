import * as authService from "../services/authService.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../utils/jwt.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { env, isProd } from "../config/env.js";

const RESET_COOKIE_NAME = "longrich_reset_session";
const resetCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role,
  status: user.status,
  hasSecretName: Boolean(user.secretNameHash),
  createdAt: user.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const user = await authService.registerUser(req.body);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ success: true, data: { user: sanitizeUser(user) } });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authService.authenticateUser(req.body);
  setAuthCookie(res, signToken(user));
  res.json({ success: true, data: { user: sanitizeUser(user) } });
});

export const logout = asyncHandler(async (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true, data: null });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: sanitizeUser(req.user) } });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: { user: sanitizeUser(user) } });
});

export const setSecretName = asyncHandler(async (req, res) => {
  const user = await authService.setSecretName(req.user.id, req.body);
  res.json({ success: true, data: { user: sanitizeUser(user) } });
});

export const verifySecretName = asyncHandler(async (req, res) => {
  const { rawToken, expiresAt } = await authService.verifySecretNameAndCreateSession(req.body);
  res.cookie(RESET_COOKIE_NAME, rawToken, {
    ...resetCookieOptions,
    maxAge: env.PASSWORD_RESET_SESSION_MINUTES * 60 * 1000,
  });
  res.json({ success: true, data: { expiresAt } });
});

export const confirmPasswordReset = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[RESET_COOKIE_NAME];
  await authService.resetPasswordWithSession(rawToken, req.body.newPassword);
  res.clearCookie(RESET_COOKIE_NAME, resetCookieOptions);
  res.json({ success: true, data: null });
});