import { BaseService } from "@/services/base.service";
import { SupportTicket, ISupportTicket, User, OrderItem, Conversation } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { TicketStatus, TicketType, TicketPriority, ResolutionType } from "@/types";
import { conversationService } from "./conversation.service";
import { messageService } from "./message.service";
import mongoose from "mongoose";

export interface CreateTicketDTO {
  customerUserId: string;
  orderItemId: string;
  title: string;
  content: string;
  type?: TicketType;
  priority?: TicketPriority;
}

export interface UpdateTicketDTO {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToUserId?: string;
  resolutionType?: ResolutionType;
  refundAmount?: number;
  decisionNote?: string;
}

export interface TicketListQuery {
  userId?: string;
  userRole: "CUSTOMER" | "SELLER" | "ADMIN" | "MODERATOR";
  status?: TicketStatus;
  priority?: TicketPriority;
  type?: TicketType;
  assignedToUserId?: string;
  page?: number;
  limit?: number;
}

export class TicketService extends BaseService<ISupportTicket> {
  constructor() {
    super(SupportTicket);
  }

  /**
   * Generate unique ticket code
   */
  private async generateTicketCode(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    // Get count for today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const count = await SupportTicket.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    const sequence = (count + 1).toString().padStart(4, "0");
    return `TK${year}${month}${day}${sequence}`;
  }

  /**
   * Create a new support ticket
   */
  async createTicket(data: CreateTicketDTO): Promise<{
    ticket: ISupportTicket;
    conversation: mongoose.Document;
  }> {
    const { customerUserId, orderItemId, title, content, type = "General", priority = "Medium" } = data;

    // Validate customer
    const customer = await User.findById(customerUserId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Validate order item
    const orderItem = await OrderItem.findById(orderItemId).populate("orderId");
    if (!orderItem) {
      throw new AppError("Order item not found", 404);
    }

    // Check if customer owns this order
    const order = orderItem.orderId as any;
    if (order?.userId?.toString() !== customerUserId) {
      throw new AppError("You can only create tickets for your own orders", 403);
    }

    // Check for existing open ticket for this order item
    const existingTicket = await SupportTicket.findOne({
      orderItemId,
      status: { $nin: ["RESOLVED_REFUNDED", "APPEAL_CLOSED"] },
    });

    if (existingTicket) {
      throw new AppError(
        `A ticket already exists for this order item (${existingTicket.ticketCode})`,
        400
      );
    }

    // Generate ticket code
    const ticketCode = await this.generateTicketCode();

    // Determine priority based on type
    let finalPriority = priority;
    if (type === "Dispute") {
      finalPriority = "High";
    }

    // Create ticket
    const ticket = await SupportTicket.create({
      ticketCode,
      customerUserId,
      orderItemId,
      title,
      content,
      type,
      priority: finalPriority,
      status: "Open",
      resolutionType: "None",
    });

    // Create conversation for this ticket
    const conversation = await conversationService.createConversation({
      type: "Support",
      customerUserId,
      ticketId: ticket._id.toString(),
    });

    // Create initial system message
    await messageService.createSystemMessage(
      conversation._id.toString(),
      `Ticket ${ticketCode} đã được tạo. Nhân viên hỗ trợ sẽ phản hồi trong thời gian sớm nhất.`
    );

    return { ticket, conversation };
  }

  /**
   * Get tickets with filtering and pagination
   */
  async getTickets(query: TicketListQuery): Promise<{
    tickets: ISupportTicket[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      userId,
      userRole,
      status,
      priority,
      type,
      assignedToUserId,
      page = 1,
      limit = 20,
    } = query;

    const filter: Record<string, unknown> = {};

    // Role-based filtering
    if (userRole === "CUSTOMER" && userId) {
      filter.customerUserId = new mongoose.Types.ObjectId(userId);
    } else if (userRole === "MODERATOR" || userRole === "ADMIN") {
      // Staff can see all tickets or filter by assignment
      if (assignedToUserId) {
        filter.assignedToUserId = new mongoose.Types.ObjectId(assignedToUserId);
      }
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;

    // Sort: Urgent first, then by priority, then by createdAt
    const [tickets, total] = await Promise.all([
      SupportTicket.aggregate([
        { $match: filter },
        {
          $addFields: {
            priorityOrder: {
              $switch: {
                branches: [
                  { case: { $eq: ["$priority", "Urgent"] }, then: 0 },
                  { case: { $eq: ["$priority", "High"] }, then: 1 },
                  { case: { $eq: ["$priority", "Medium"] }, then: 2 },
                  { case: { $eq: ["$priority", "Low"] }, then: 3 },
                ],
                default: 4,
              },
            },
          },
        },
        { $sort: { priorityOrder: 1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "customerUserId",
            foreignField: "_id",
            as: "customer",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "assignedToUserId",
            foreignField: "_id",
            as: "assignedTo",
          },
        },
        {
          $lookup: {
            from: "orderitems",
            localField: "orderItemId",
            foreignField: "_id",
            as: "orderItem",
          },
        },
        {
          $project: {
            priorityOrder: 0,
          },
        },
      ]),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      tickets: tickets as ISupportTicket[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get ticket by ID with access control
   */
  async getTicketById(
    ticketId: string,
    userId: string,
    userRole: string
  ): Promise<ISupportTicket> {
    const ticket = await SupportTicket.findById(ticketId)
      .populate("customerUserId", "fullName email avatar")
      .populate("assignedToUserId", "fullName email avatar")
      .populate("decidedByUserId", "fullName email")
      .populate({
        path: "orderItemId",
        populate: {
          path: "productId",
          select: "name images",
        },
      });

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Check access
    const isOwner = ticket.customerUserId?._id?.toString() === userId;
    const isAssigned = ticket.assignedToUserId?._id?.toString() === userId;
    const isStaff = userRole === "ADMIN" || userRole === "MODERATOR";

    if (!isOwner && !isAssigned && !isStaff) {
      throw new AppError("You do not have access to this ticket", 403);
    }

    return ticket;
  }

  /**
   * Update ticket
   */
  async updateTicket(
    ticketId: string,
    data: UpdateTicketDTO,
    userId: string,
    userRole: string
  ): Promise<ISupportTicket> {
    // Verify access first
    await this.getTicketById(ticketId, userId, userRole);

    // Check permissions for different updates
    const isStaff = userRole === "ADMIN" || userRole === "MODERATOR";

    // Customer can only close their own ticket
    if (!isStaff) {
      if (data.status && data.status !== "APPEAL_CLOSED") {
        throw new AppError("You can only close your ticket", 403);
      }
      if (data.assignedToUserId || data.resolutionType || data.priority) {
        throw new AppError("Only staff can perform this action", 403);
      }
    }

    // Prepare update data
    const updateData: Partial<ISupportTicket> = {};

    if (data.status) {
      updateData.status = data.status;

      // Set decision info when resolving
      if (data.status === "RESOLVED_REFUNDED" && isStaff) {
        updateData.decidedByUserId = new mongoose.Types.ObjectId(userId);
        updateData.decidedAt = new Date();
      }
    }

    if (data.priority) updateData.priority = data.priority;
    if (data.assignedToUserId) {
      updateData.assignedToUserId = new mongoose.Types.ObjectId(data.assignedToUserId);
    }
    if (data.resolutionType) updateData.resolutionType = data.resolutionType;
    if (data.refundAmount !== undefined) updateData.refundAmount = data.refundAmount;
    if (data.decisionNote) updateData.decisionNote = data.decisionNote;

    const updated = await SupportTicket.findByIdAndUpdate(ticketId, updateData, {
      new: true,
    }).populate("customerUserId assignedToUserId decidedByUserId orderItemId");

    if (!updated) {
      throw new AppError("Failed to update ticket", 500);
    }

    // Create system message about status change
    if (data.status) {
      const conversation = await Conversation.findOne({ ticketId });
      if (conversation) {
        let message = "";
        switch (data.status) {
          case "MODERATOR_REVIEW":
            message = `Ticket đang được xem xét bởi nhân viên hỗ trợ.`;
            break;
          case "AUTO_ESCALATED":
            message = `Ticket được tự động chuyển đến nhân viên hỗ trợ.`;
            break;
          case "RESOLVED_REFUNDED":
            message = `Ticket đã được giải quyết. ${data.decisionNote || ""}`;
            break;
          case "APPEAL_CLOSED":
            message = `Ticket đã được đóng.`;
            break;
        }
        if (message) {
          await messageService.createSystemMessage(conversation._id.toString(), message);
        }
      }
    }

    return updated;
  }

  /**
   * Assign ticket to staff
   */
  async assignTicket(
    ticketId: string,
    staffUserId: string,
    _assignedBy: string // Reserved for audit logging
  ): Promise<ISupportTicket> {
    const staff = await User.findById(staffUserId);
    if (!staff) {
      throw new AppError("Staff user not found", 404);
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      {
        assignedToUserId: staffUserId,
        status: "MODERATOR_REVIEW",
      },
      { new: true }
    );

    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Also assign staff to conversation
    const conversation = await Conversation.findOne({ ticketId });
    if (conversation) {
      await conversationService.assignStaff(conversation._id.toString(), staffUserId);
      await messageService.createSystemMessage(
        conversation._id.toString(),
        `Ticket đã được phân công cho nhân viên hỗ trợ.`
      );
    }

    return ticket;
  }

  /**
   * Escalate ticket priority
   */
  async escalateTicket(
    ticketId: string,
    escalatedBy: string,
    reason?: string
  ): Promise<ISupportTicket> {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      throw new AppError("Ticket not found", 404);
    }

    // Escalate priority
    let newPriority: TicketPriority = "High";
    if (ticket.priority === "High") {
      newPriority = "Urgent";
    } else if (ticket.priority === "Urgent") {
      throw new AppError("Ticket is already at highest priority", 400);
    }

    const updated = await SupportTicket.findByIdAndUpdate(
      ticketId,
      {
        priority: newPriority,
        escalatedAt: new Date(),
        escalatedByUserId: escalatedBy,
      },
      { new: true }
    );

    // Create system message
    const conversation = await Conversation.findOne({ ticketId });
    if (conversation) {
      await messageService.createSystemMessage(
        conversation._id.toString(),
        `Ticket đã được nâng cấp độ ưu tiên lên ${newPriority}.${reason ? ` Lý do: ${reason}` : ""}`
      );
    }

    return updated!;
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(userId?: string, userRole?: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    avgResolutionTime: number;
  }> {
    const filter: Record<string, unknown> = {};

    if (userRole === "CUSTOMER" && userId) {
      filter.customerUserId = new mongoose.Types.ObjectId(userId);
    }

    const [total, byStatus, byPriority, resolutionStats] = await Promise.all([
      SupportTicket.countDocuments(filter),
      SupportTicket.aggregate([
        { $match: filter },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      SupportTicket.aggregate([
        { $match: filter },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      SupportTicket.aggregate([
        {
          $match: {
            ...filter,
            status: "RESOLVED_REFUNDED",
            decidedAt: { $exists: true },
          },
        },
        {
          $project: {
            resolutionTime: {
              $subtract: ["$decidedAt", "$createdAt"],
            },
          },
        },
        {
          $group: {
            _id: null,
            avgTime: { $avg: "$resolutionTime" },
          },
        },
      ]),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const priorityMap: Record<string, number> = {};
    byPriority.forEach((p) => {
      priorityMap[p._id] = p.count;
    });

    // Convert avg time from ms to hours
    const avgResolutionTime = resolutionStats[0]?.avgTime
      ? Math.round(resolutionStats[0].avgTime / (1000 * 60 * 60))
      : 0;

    return {
      total,
      byStatus: statusMap,
      byPriority: priorityMap,
      avgResolutionTime,
    };
  }
}

export const ticketService = new TicketService();
