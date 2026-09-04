import * as adminService from "../services/adminService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await adminService.getDashboardStats();
  res.json({ success: true, data: { stats } });
});

export const getUsers = asyncHandler(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  res.json({ success: true, data: result });
});

export const updateUserStatusOrRole = asyncHandler(async (req, res) => {
  const user = await adminService.updateUserStatusOrRole(req.params.id, req.body);
  res.json({ success: true, data: { user } });
});