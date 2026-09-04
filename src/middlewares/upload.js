import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { cloudinary } from "../config/cloudinary.js";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

// Stocke directement sur Cloudinary au lieu du disque local (ephemere sur
// Render). Le dossier Cloudinary distingue logo/produits/avatars pour
// rester organise cote tableau de bord Cloudinary.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: "longrich",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    // Nom unique pour eviter les collisions entre uploads
    public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
  }),
});

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(AppError.badRequest("Format d'image non supporte (jpeg, png, webp, gif uniquement)"));
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
});

// Usage : router.post("/x", upload.single("logo"), controller) -> req.file
// req.file.path contient desormais l'URL Cloudinary complete (https://...),
// req.file.filename contient le public_id Cloudinary (utile pour une suppression future).