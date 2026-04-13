import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { ticketService } from "@/services/support";
import { emitTicketEvent } from "@/config/socket";
import { z } from "zod";

// Validation schemas
const createTicketSchema = z.object({
  orderItemId: z.string().min(1, "Order item ID is required"),
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  content: z.string().min(20, "Content must be at least 20 characters").max(5000),
  type: z.enum(["Complaint", "Dispute", "General"]).optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
});

const updateTicketSchema = z.object({
  status: z
    .enum([
      "PENDING_SELLER",
      "SELLER_APPROVED",
      "SELLER_REJECTED",
      "AUTO_ESCALATED",
      "MODERATOR_REVIEW",
      "RESOLVED_REFUNDED",
      "CLOSED_REJECTED",
      "APPEAL_FILED",
      "APPEAL_REVIEW",
      "APPEAL_CLOSED",
    ])
    .optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  assignedToUserId: z.string().optional(),
  resolutionType: z.enum(["None", "FullRefund", "PartialRefund", "Replace", "Reject"]).optional(),
  refundAmount: z.number().min(0).optional(),
  decisionNote: z.string().max(2000).optional(),
});

const assignTicketSchema = z.object({
  staffUserId: z.string().min(1, "Staff user ID is required"),
});

const escalateTicketSchema = z.object({
  reason: z.string().max(500).optional(),
});

// Helper to safely get string from params
const getParamString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

export class TicketController {
  /**
   * Create a new support ticket
   * POST /tickets
   */
  createTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = createTicketSchema.parse(req.body);

      const { ticket, conversation } = await ticketService.createTicket({
        ...validatedData,
        customerUserId: userId,
      });

      // Emit socket event for staff notification
      setImmediate(() => {
        emitTicketEvent("ticket:created", {
          ticketId: ticket._id.toString(),
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          priority: ticket.priority,
          customerUserId: userId,
        });
      });

      res.status(201).json({
        success: true,
        message: "Support ticket created successfully",
        data: {
          ticket,
          conversationId: conversation._id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get tickets with filtering
   * GET /tickets
   */
  getTickets = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string | undefined;
      const priority = req.query.priority as string | undefined;
      const type = req.query.type as string | undefined;
      const assignedToUserId = req.query.assignedToUserId as string | undefined;

      const result = await ticketService.getTickets({
        userId,
        userRole: userRole as "CUSTOMER" | "SELLER" | "ADMIN" | "MODERATOR",
        status: status as any,
        priority: priority as any,
        type: type as any,
        assignedToUserId,
        page,
        limit,
      });

      res.json({
        success: true,
        data: result.tickets,
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
   * Get ticket by ID
   * GET /tickets/:id
   */
  getTicketById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const ticketId = getParamString(req.params.id);

      const ticket = await ticketService.getTicketById(ticketId, userId, userRole);

      res.json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update ticket
   * PATCH /tickets/:id
   */
  updateTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";
      const ticketId = getParamString(req.params.id);
      const validatedData = updateTicketSchema.parse(req.body);

      const ticket = await ticketService.updateTicket(
        ticketId,
        validatedData,
        userId,
        userRole
      );

      // Emit socket event
      setImmediate(() => {
        emitTicketEvent("ticket:updated", {
          ticketId: ticket._id.toString(),
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          priority: ticket.priority,
          assignedToUserId: ticket.assignedToUserId?.toString(),
          customerUserId: ticket.customerUserId.toString(),
        });
      });

      res.json({
        success: true,
        message: "Ticket updated successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign ticket to staff
   * POST /tickets/:id/assign
   */
  assignTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const assignerUserId = req.user!.id;
      const ticketId = getParamString(req.params.id);
      const { staffUserId } = assignTicketSchema.parse(req.body);

      const ticket = await ticketService.assignTicket(ticketId, staffUserId, assignerUserId);

      // Emit socket event
      setImmediate(() => {
        emitTicketEvent("ticket:assigned", {
          ticketId: ticket._id.toString(),
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          priority: ticket.priority,
          assignedToUserId: staffUserId,
          customerUserId: ticket.customerUserId.toString(),
        });
      });

      res.json({
        success: true,
        message: "Ticket assigned successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Escalate ticket priority
   * POST /tickets/:id/escalate
   */
  escalateTicket = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const escalaterUserId = req.user!.id;
      const ticketId = getParamString(req.params.id);
      const { reason } = escalateTicketSchema.parse(req.body);

      const ticket = await ticketService.escalateTicket(ticketId, escalaterUserId, reason);

      // Emit socket event
      setImmediate(() => {
        emitTicketEvent("ticket:escalated", {
          ticketId: ticket._id.toString(),
          ticketCode: ticket.ticketCode,
          status: ticket.status,
          priority: ticket.priority,
          customerUserId: ticket.customerUserId.toString(),
        });
      });

      res.json({
        success: true,
        message: "Ticket escalated successfully",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get ticket statistics
   * GET /tickets/stats
   */
  getTicketStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.roleKey || "CUSTOMER";

      const stats = await ticketService.getTicketStats(
        userRole === "CUSTOMER" ? userId : undefined,
        userRole
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const ticketController = new TicketController();
