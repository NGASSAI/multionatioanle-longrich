import * as activityLogService from "../services/activityLogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getActivityLogs = asyncHandler(async (req, res) => {
  const result = await activityLogService.getActivityLogs(req.query);
  res.json({ success: true, data: result });
});