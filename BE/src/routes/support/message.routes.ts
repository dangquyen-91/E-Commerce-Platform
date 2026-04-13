import { Router } from "express";
import { messageController } from "@/controllers/support";
import { authenticate, checkPermission } from "@/middleware";
import { messageLimiter } from "@/middleware/rateLimiter";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Send a message
router.post(
  "/",
  checkPermission(PERMISSIONS.CONVERSATION_MESSAGE),
  messageLimiter,
  wrapRequestHandler(messageController.sendMessage)
);

// Search messages across conversations
router.get(
  "/search",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(messageController.searchMessages)
);

// Mark multiple messages as read
router.post(
  "/read",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(messageController.markAsRead)
);

// Get messages for a conversation
router.get(
  "/:conversationId",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(messageController.getMessages)
);

// Delete a message
router.delete(
  "/:id",
  checkPermission(PERMISSIONS.CONVERSATION_MESSAGE),
  wrapRequestHandler(messageController.deleteMessage)
);

export default router;
