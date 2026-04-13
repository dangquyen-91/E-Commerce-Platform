import { Router } from "express";
import { conversationController } from "@/controllers/support";
import { authenticate, checkPermission } from "@/middleware";
import { conversationLimiter } from "@/middleware/rateLimiter";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post(
  "/",
  checkPermission(PERMISSIONS.CONVERSATION_CREATE),
  conversationLimiter,
  wrapRequestHandler(conversationController.createConversation)
);

router.get(
  "/",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(conversationController.getConversations)
);

router.get(
  "/unread-count",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(conversationController.getUnreadCount)
);

router.get(
  "/:id",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(conversationController.getConversationById)
);

router.post(
  "/:id/read",
  checkPermission(PERMISSIONS.CONVERSATION_VIEW),
  wrapRequestHandler(conversationController.markAsRead)
);

router.patch(
  "/:id/status",
  checkPermission(PERMISSIONS.CONVERSATION_MESSAGE),
  wrapRequestHandler(conversationController.updateStatus)
);

// Staff routes
router.post(
  "/:id/assign",
  checkPermission(PERMISSIONS.TICKET_ASSIGN),
  wrapRequestHandler(conversationController.assignStaff)
);

export default router;
