import { AppError } from "../utils/AppError.js";

// Valide req.body / req.query / req.params avec un schéma Zod.
// Usage : router.post("/x", validate({ body: mySchema }), controller)
export const validate = (schemas) => (req, res, next) => {
  for (const key of ["body", "query", "params"]) {
    const schema = schemas[key];
    if (!schema) continue;

    const result = schema.safeParse(req[key]);
    if (!result.success) {
      const details = result.error.flatten().fieldErrors;
      const error = AppError.badRequest("Données invalides", "VALIDATION_ERROR");
      error.details = details;
      return next(error);
    }
    req[key] = result.data;
  }
  next();
};
