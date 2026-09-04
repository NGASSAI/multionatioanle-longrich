import * as settingsService from "../services/settingsService.js";
import * as activityLogService from "../services/activityLogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

// Accessible a tous (le frontend en a besoin des le chargement de n'importe
// quelle page : nom du site, logo).
export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getAllSettings();
  res.json({ success: true, data: { settings } });
});

// Reserve au Super Admin (parametres globaux du site).
export const updateSiteName = asyncHandler(async (req, res) => {
  const { siteName } = req.body;
  await settingsService.updateSetting(settingsService.SETTING_KEYS.SITE_NAME, siteName);
  const settings = await settingsService.getAllSettings();

  await activityLogService.logActivity({
    userId: req.user.id,
    action: "settings.update",
    description: `Nom du site modifie en "${siteName}"`,
    ipAddress: req.ip,
  });

  res.json({ success: true, data: { settings } });
});

// Reserve au Super Admin. Attend un fichier via multer (champ "logo"),
// desormais uploade directement sur Cloudinary par le middleware upload.js.
export const updateSiteLogo = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest("Aucun fichier logo fourni");
  }

  // req.file.path contient l'URL Cloudinary complete et directement utilisable
  // (plus de chemin local a reconstruire).
  const logoUrl = req.file.path;

  await settingsService.updateSetting(settingsService.SETTING_KEYS.SITE_LOGO, logoUrl);
  const settings = await settingsService.getAllSettings();

  await activityLogService.logActivity({
    userId: req.user.id,
    action: "settings.update",
    description: "Logo du site mis a jour",
    ipAddress: req.ip,
  });

  res.json({ success: true, data: { settings } });
});