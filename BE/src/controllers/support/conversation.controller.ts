import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { conversationService } from "@/services/support";
import { z } from "zod";

// Validation schemas
const createConversationSchema = z.object({
  type: z.enum(["OrderItem", "Shop", "Support"]),
  shopId: z.string().optional(),
  orderItemId: z.string().optional(),
  ticketId: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["Open", "Closed", "Blocked"]),
});

const assignStaffSchema = z.object({
  staffUserId: z.string().min(1, "Staff user ID is required"),
});

// Helper to safely get string from params
const getParamString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

export class ConversationController {
  /**
   * Create a new conversation
   * POST /conversations
   */
  createConversation = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = createConversationSchema.parse(req.body);

      const conversation = await conversationService.createConversation({
        ...validatedData,
        customerUserId: userId,
      });

      res.status(201).json({
        success: true,
        message: "Conversation created successfully",
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's conversations
   * GET /conversations
   */
  getConversations = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await conversationService.getConversationsForUser({
        userId,
        userRole: userRole as "CUSTOMER" | "SELLER" | "ADMIN" | "MODERATOR",
        type: type as "OrderItem" | "Shop" | "Support" | undefined,
        status: status as "Open" | "Closed" | "Blocked" | undefined,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result.conversations,
        pagination: {
          page: result.page,
          totalPages: result.totalPages,
          total: result.total,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get conversation by ID
   * GET /conversations/:id
   */
  getConversationById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const conversationId = getParamString(req.params.id);

      const conversation = await conversationService.getConversationById(
        conversationId,
        userId,
        userRole
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update conversation status
   * PATCH /conversations/:id/status
   */
  updateStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const conversationId = getParamString(req.params.id);
      const { status } = updateStatusSchema.parse(req.body);

      const conversation = await conversationService.updateStatus(
        conversationId,
        status,
        userId,
        userRole
      );

      res.json({
        success: true,
        message: "Conversation status updated",
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark conversation as read
   * POST /conversations/:id/read
   */
  markAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const conversationId = getParamString(req.params.id);

      await conversationService.markAsRead(conversationId, userId);

      res.json({
        success: true,
        message: "Conversation marked as read",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign staff to conversation (Admin/Moderator only)
   * POST /conversations/:id/assign
   */
  assignStaff = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const conversationId = getParamString(req.params.id);
      const { staffUserId } = assignStaffSchema.parse(req.body);

      const conversation = await conversationService.assignStaff(
        conversationId,
        staffUserId
      );

      res.json({
        success: true,
        message: "Staff assigned to conversation",
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get total unread count for user
   * GET /conversations/unread-count
   */
  getUnreadCount = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;

      const count = await conversationService.getTotalUnreadCount(userId);

      res.json({
        success: true,
        data: { unreadCount: count },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const conversationController = new ConversationController();
