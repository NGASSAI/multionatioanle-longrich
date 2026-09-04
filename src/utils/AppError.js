// Erreur applicative standardisée : tout code métier doit lancer une AppError
// (jamais une Error générique) pour que errorHandler sache quoi répondre au client.
export class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, code = "BAD_REQUEST") {
    return new AppError(message, 400, code);
  }

  static unauthorized(message = "Non authentifié", code = "UNAUTHORIZED") {
    return new AppError(message, 401, code);
  }

  static forbidden(message = "Accès refusé", code = "FORBIDDEN") {
    return new AppError(message, 403, code);
  }

  static notFound(message = "Ressource introuvable", code = "NOT_FOUND") {
    return new AppError(message, 404, code);
  }

  static conflict(message, code = "CONFLICT") {
    return new AppError(message, 409, code);
  }

  static tooMany(message = "Trop de tentatives, réessayez plus tard", code = "TOO_MANY_REQUESTS") {
    return new AppError(message, 429, code);
  }
}
