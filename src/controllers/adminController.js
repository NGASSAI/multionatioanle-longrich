import * as adminService from "../services/adminService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as activityLogService from "../services/activityLogService.js";

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
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await adminService.deleteUser(req.params.id);
  await activityLogService.logActivity({
    userId: req.user.id,
    action: "user.delete",
    description: `Suppression du client "${user.name}" (${user.email})`,
    ipAddress: req.ip,
  });
  res.json({ success: true, data: null });
});