import * as chatService from "../services/chatService.js";
import * as notificationService from "../services/notificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getMyConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.getOrCreateClientConversation(req.user.id);
  res.json({ success: true, data: { conversation } });
});

export const getAllConversations = asyncHandler(async (req, res) => {
  const result = await chatService.getAllConversations(req.query);
  res.json({ success: true, data: result });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const result = await chatService.saveMessage(conversationId, req.user.id, req.body);

  // Notifie l'autre participant de la conversation (client <-> admin assigne)
  const io = req.app.get("io");
  await notificationService.notifyNewMessage(io, result);

  res.status(201).json({ success: true, data: result });
});

export const markAsRead = asyncHandler(async (req, res) => {
  await chatService.markMessagesAsRead(req.params.conversationId, req.user.id);
  res.json({ success: true, data: null });
});
export const getConversationById = asyncHandler(async (req, res) => {
  const conversation = await chatService.getConversationById(req.params.id);
  res.json({ success: true, data: { conversation } });
});
export const deleteMessage = asyncHandler(async (req, res) => {
  const result = await chatService.deleteMessage(req.params.messageId, req.user.id);
  const io = req.app.get("io");
  io?.to(`conversation:${result.conversationId}`).emit("message:deleted", { messageId: result.messageId });
  res.json({ success: true, data: null });
});