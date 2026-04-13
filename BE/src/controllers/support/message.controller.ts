import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { messageService } from "@/services/support";
import { AppError } from "@/middleware/errorHandler";
import { emitChatEvent } from "@/config/socket";
import { z } from "zod";

// Validation schemas
const sendMessageSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
  messageType: z.enum(["Text", "System", "Attachment"]),
  body: z.string().max(5000).optional(),
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.enum(["Image", "File", "None"]),
        fileName: z.string().optional(),
        fileSize: z.number().optional(),
      })
    )
    .max(10, "Maximum 10 attachments allowed")
    .optional(),
  isInternal: z.boolean().optional(),
});

const markReadSchema = z.object({
  messageIds: z.array(z.string()).min(1, "At least one message ID is required"),
});

// Helper to safely get string from params
const getParamString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

export class MessageController {
  /**
   * Send a new message
   * POST /messages
   */
  sendMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = sendMessageSchema.parse(req.body);

      const message = await messageService.sendMessage({
        ...validatedData,
        senderUserId: userId,
      });

      // Populate sender info
      const populatedMessage = await message.populate("senderUserId", "fullName avatar");

      // Emit socket event for real-time update
      setImmediate(() => {
        emitChatEvent("message:new", {
          messageId: message._id.toString(),
          conversationId: validatedData.conversationId,
          senderUserId: userId,
          senderName: req.user!.email, // Use email as identifier
          messageType: validatedData.messageType,
          body: validatedData.body,
          attachments: validatedData.attachments,
          isInternal: validatedData.isInternal,
          sentAt: message.sentAt,
        });
      });

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: populatedMessage,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get messages for a conversation
   * GET /messages/:conversationId
   */
  getMessages = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const conversationId = getParamString(req.params.conversationId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before ? new Date(req.query.before as string) : undefined;

      const result = await messageService.getMessages({
        conversationId,
        userId,
        userRole,
        page,
        limit,
        before,
      });

      res.json({
        success: true,
        data: result.messages,
        hasMore: result.hasMore,
        total: result.total,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a message
   * DELETE /messages/:id
   */
  deleteMessage = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const messageId = getParamString(req.params.id);

      const message = await messageService.deleteMessage(messageId, userId, userRole);

      // Emit socket event
      setImmediate(() => {
        emitChatEvent("message:deleted", {
          messageId,
          conversationId: message.conversationId.toString(),
          senderUserId: userId,
          messageType: message.messageType,
          sentAt: new Date(),
        });
      });

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark messages as read
   * POST /messages/read
   */
  markAsRead = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { messageIds } = markReadSchema.parse(req.body);

      await messageService.markMessagesAsRead(messageIds, userId);

      res.json({
        success: true,
        message: "Messages marked as read",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search messages
   * GET /messages/search
   */
  searchMessages = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const searchTerm = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!searchTerm || searchTerm.length < 2) {
        throw new AppError("Search term must be at least 2 characters", 400);
      }

      const messages = await messageService.searchMessages(
        userId,
        userRole,
        searchTerm,
        limit
      );

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const messageController = new MessageController();
