import * as statsService from "../services/statsService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Reserve a l'Admin (donnee metier) — le Super Admin n'y a pas acces.
// Accepte ?from=YYYY-MM-DD&to=YYYY-MM-DD pour filtrer le CA sur une periode.
// Execution sequentielle (pas Promise.all) : evite de saturer le pool de
// connexions poolees Neon avec 6 requetes simultanees.
export const getStats = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const revenue = await statsService.getRevenue({ from, to });
  const topClients = await statsService.getTopClients();
  const topSellingProducts = await statsService.getTopSellingProducts();
  const mostLikedProducts = await statsService.getMostLikedProducts();
  const ordersByChannel = await statsService.getOrdersByChannel();
  const conversion = await statsService.getConversionRate();

  res.json({
    success: true,
    data: {
      revenue,
      topClients,
      topSellingProducts,
      mostLikedProducts,
      ordersByChannel,
      conversion,
    },
  });
});