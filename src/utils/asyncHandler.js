// Évite d'écrire un try/catch dans chaque controller async : toute erreur
// rejetée est transmise à errorHandler via next().
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
