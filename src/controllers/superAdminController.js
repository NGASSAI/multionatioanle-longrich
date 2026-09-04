import * as superAdminService from "../services/superAdminService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminAccounts = asyncHandler(async (req, res) => {
  const admins = await superAdminService.getAdminAccounts();
  res.json({ success: true, data: { admins } });
});

export const createAdminAccount = asyncHandler(async (req, res) => {
  const admin = await superAdminService.createAdminAccount(req.body);
  res.status(201).json({ success: true, data: { admin } });
});

export const updateAdminStatus = asyncHandler(async (req, res) => {
  const admin = await superAdminService.updateAdminStatus(req.params.id, req.body.status);
  res.json({ success: true, data: { admin } });
});

export const deleteAdminAccount = asyncHandler(async (req, res) => {
  await superAdminService.deleteAdminAccount(req.params.id);
  res.json({ success: true, data: null });
});