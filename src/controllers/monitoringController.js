import * as monitoringService from "../services/monitoringService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSystemStatus = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const status = await monitoringService.getSystemStatus(io);
  res.json({ success: true, data: { status } });
});