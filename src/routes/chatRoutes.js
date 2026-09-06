import { Router } from "express";
import * as chatController from "../controllers/chatController.js";
import { protect, restrictTo } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { sendMessageSchema } from "../validators/chatValidators.js";

const router = Router();

// Routes Client
router.get("/my-conversation", protect, chatController.getMyConversation);

// Routes Admin
router.get("/", protect, restrictTo("admin"), chatController.getAllConversations);

// Routes partagées
router.post(
  "/:conversationId/messages",
  protect,
  validate({ body: sendMessageSchema }),
  chatController.sendMessage
);

router.patch("/:conversationId/read", protect, chatController.markAsRead);
router.delete("/:conversationId/messages/:messageId", protect, chatController.deleteMessage);
router.delete("/:id", protect, chatController.deleteConversation);
router.get("/:id", protect, restrictTo("admin"), chatController.getConversationById);

export default router;