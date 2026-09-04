import * as userService from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.json({ success: true, data: { user } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  res.json({ success: true, data: { user } });
});

export const updateMyPassword = asyncHandler(async (req, res) => {
  await userService.updatePassword(req.user.id, req.body);
  res.json({ success: true, message: "Mot de passe mis à jour avec succès" });
});