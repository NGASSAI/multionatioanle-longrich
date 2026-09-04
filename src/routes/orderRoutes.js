import { Router } from "express";
import * as orderController from "../controllers/orderController.js";
import { protect, restrictTo, optionalAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
} from "../validators/orderValidators.js";

const router = Router();

// Créer une commande (Client connecté via token/cookie, ou client invité)
router.post("/", optionalAuth, validate({ body: createOrderSchema }), orderController.createOrder);

// Obtenir ses propres commandes (Client authentifié)
router.get("/my-orders", protect, orderController.getMyOrders);

// Détail d'une commande
router.get("/:id", protect, orderController.getOrderById);

// Routes d'administration
router.get("/", protect, restrictTo("admin"), orderController.getAllOrders);

router.patch(
  "/:id/status",
  protect,
  restrictTo("admin"),
  validate({ body: updateOrderStatusSchema }),
  orderController.updateOrderStatus
);

router.patch(
  "/:id/payment",
  protect,
  restrictTo("admin"),
  validate({ body: updatePaymentStatusSchema }),
  orderController.updatePaymentStatus
);

export default router;