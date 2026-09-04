import * as orderService from "../services/orderService.js";
import * as notificationService from "../services/notificationService.js";
import * as activityLogService from "../services/activityLogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user || null);

  // Notifie tous les admins actifs qu'une nouvelle commande vient d'arriver
  const io = req.app.get("io");
  await notificationService.notifyNewOrder(io, order);

  res.status(201).json({ success: true, data: { order } });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.getMyOrders(req.user.id);
  res.json({ success: true, data: { orders } });
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id, req.user);
  res.json({ success: true, data: { order } });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const result = await orderService.getAllOrders(req.query);
  res.json({ success: true, data: result });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.user.id
  );

  // Notifie le client (s'il a un compte) du changement de statut
  const io = req.app.get("io");
  await notificationService.notifyOrderStatusChange(io, order);

  // Audit : changement de statut de commande = action sensible
  await activityLogService.logActivity({
    userId: req.user.id,
    action: "order.status_update",
    description: `Commande ${order.orderNumber} passee au statut "${order.status}"`,
    ipAddress: req.ip,
  });

  res.json({ success: true, data: { order } });
});

export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updatePaymentStatus(
    req.params.id,
    req.body.paymentStatus
  );
  res.json({ success: true, data: { order } });
});