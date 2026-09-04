import { isProd } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

export const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} introuvable`));
};

// Doit rester le DERNIER middleware monté dans app.js (4 arguments = signature Express pour un error handler)
export const errorHandler = (err, req, res, next) => {
  let error = err;

  // Erreurs Prisma connues -> converties en AppError lisibles côté client
  if (err.code === "P2002") {
    error = AppError.conflict(
      `La valeur fournie pour "${err.meta?.target?.join?.(", ") ?? "ce champ"}" est déjà utilisée`,
      "DUPLICATE_ENTRY"
    );
  } else if (err.code === "P2025") {
    error = AppError.notFound("Ressource introuvable");
  } else if (!(err instanceof AppError)) {
    error = new AppError(
      isProd ? "Une erreur interne est survenue" : err.message,
      err.statusCode || 500,
      "INTERNAL_ERROR"
    );
  }

  if (!error.isOperational && !isProd) {
    console.error(err);
  } else if (error.statusCode >= 500) {
    console.error(err);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    code: error.code || "INTERNAL_ERROR",
    message: error.message,
    ...(error.details ? { details: error.details } : {}),
  });
};
