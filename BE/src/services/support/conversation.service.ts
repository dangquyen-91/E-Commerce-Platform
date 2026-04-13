import { BaseService } from "@/services/base.service";
import {
  Conversation,
  IConversation,
  Message,
  User,
  Shop,
  OrderItem,
  SupportTicket,
} from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { ConversationType, ConversationStatus } from "@/types";
import mongoose from "mongoose";

export interface CreateConversationDTO {
  type: ConversationType;
  customerUserId: string;
  sellerUserId?: string;
  staffUserId?: string;
  shopId?: string;
  orderItemId?: string;
  ticketId?: string;
}

export interface ConversationListQuery {
  userId: string;
  userRole: "CUSTOMER" | "SELLER" | "ADMIN" | "MODERATOR";
  type?: ConversationType;
  status?: ConversationStatus;
  page?: number;
  limit?: number;
}

export class ConversationService extends BaseService<IConversation> {
  constructor() {
    super(Conversation);
  }

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationDTO): Promise<IConversation> {
    const { type, customerUserId, sellerUserId, shopId, orderItemId, ticketId } = data;

    // Validate customer exists
    const customer = await User.findById(customerUserId);
    if (!customer) {
      throw new AppError("Customer not found", 404);
    }

    // Check for existing conversation based on type
    let existingConversation: IConversation | null = null;

    if (type === "OrderItem" && orderItemId) {
      existingConversation = await Conversation.findOne({
        type: "OrderItem",
        customerUserId,
        orderItemId,
        status: { $ne: "Closed" },
      });
    } else if (type === "Shop" && shopId) {
      existingConversation = await Conversation.findOne({
        type: "Shop",
        customerUserId,
        shopId,
        status: { $ne: "Closed" },
      });
    } else if (type === "Support" && ticketId) {
      existingConversation = await Conversation.findOne({
        type: "Support",
        ticketId,
      });
    }

    if (existingConversation) {
      return existingConversation;
    }

    // Validate references based on type
    if (type === "OrderItem" && orderItemId) {
      const orderItem = await OrderItem.findById(orderItemId).populate("orderId");
      if (!orderItem) {
        throw new AppError("Order item not found", 404);
      }
    }

    if ((type === "Shop" || type === "OrderItem") && shopId) {
      const shop = await Shop.findById(shopId);
      if (!shop) {
        throw new AppError("Shop not found", 404);
      }
    }

    if (type === "Support" && ticketId) {
      const ticket = await SupportTicket.findById(ticketId);
      if (!ticket) {
        throw new AppError("Support ticket not found", 404);
      }
    }

    // Get seller from shop if not provided
    let finalSellerUserId = sellerUserId;
    if (!finalSellerUserId && shopId) {
      const shop = await Shop.findById(shopId);
      if (shop) {
        finalSellerUserId = shop.ownerUserId.toString();
      }
    }

    // Block self-chat: a user cannot chat with their own shop
    if (finalSellerUserId && finalSellerUserId === customerUserId) {
      throw new AppError("You cannot chat with your own shop", 400);
    }

    // Create conversation
    const conversation = await Conversation.create({
      type,
      customerUserId,
      sellerUserId: finalSellerUserId || null,
      staffUserId: data.staffUserId || null,
      shopId: shopId || null,
      orderItemId: orderItemId || null,
      ticketId: ticketId || null,
      status: "Open",
      unreadCount: {},
    });

    return conversation;
  }

  /**
   * Get conversations for a user based on their role
   */
  async getConversationsForUser(query: ConversationListQuery): Promise<{
    conversations: IConversation[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { userId, userRole, type, status, page = 1, limit = 20 } = query;

    const filter: Record<string, unknown> = {};

    // Filter by role
    if (userRole === "CUSTOMER") {
      filter.customerUserId = new mongoose.Types.ObjectId(userId);
    } else if (userRole === "SELLER") {
      filter.sellerUserId = new mongoose.Types.ObjectId(userId);
    } else if (userRole === "ADMIN" || userRole === "MODERATOR") {
      // Staff can see Support conversations or all if assigned
      filter.$or = [
        { staffUserId: new mongoose.Types.ObjectId(userId) },
        { type: "Support" },
      ];
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      Conversation.find(filter)
        .populate("customerUserId", "fullName avatar email")
        .populate("sellerUserId", "fullName avatar email")
        .populate("staffUserId", "fullName avatar email")
        .populate("shopId", "shopName logo")
        .populate("ticketId", "ticketCode title status priority")
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(filter),
    ]);

    return {
      conversations: conversations as IConversation[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a conversation by ID with access control
   */
  async getConversationById(
    conversationId: string,
    userId: string,
    userRole: string
  ): Promise<IConversation> {
    const conversation = await Conversation.findById(conversationId)
      .populate("customerUserId", "fullName avatar email")
      .populate("sellerUserId", "fullName avatar email")
      .populate("staffUserId", "fullName avatar email")
      .populate("shopId", "shopName logo")
      .populate("orderItemId")
      .populate("ticketId");

    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    // Check access
    const hasAccess = this.checkConversationAccess(conversation, userId, userRole);
    if (!hasAccess) {
      throw new AppError("You do not have access to this conversation", 403);
    }

    return conversation;
  }

  /**
   * Check if user has access to conversation
   */
  checkConversationAccess(
    conversation: IConversation,
    userId: string,
    userRole: string
  ): boolean {
    // Helper to get ID from populated or unpopulated field
    const getId = (field: unknown): string | undefined => {
      if (!field) return undefined;
      // If it's a populated object with _id
      if (typeof field === "object" && field !== null && "_id" in field) {
        return (field as { _id: unknown })._id?.toString();
      }
      // If it's just an ObjectId or string
      return field.toString();
    };

    const customerMatch = getId(conversation.customerUserId) === userId;
    const sellerMatch = getId(conversation.sellerUserId) === userId;
    const staffMatch = getId(conversation.staffUserId) === userId;
    const isStaff = userRole === "ADMIN" || userRole === "MODERATOR";

    return customerMatch || sellerMatch || staffMatch || isStaff;
  }

  /**
   * Update unread count for a conversation
   */
  async incrementUnreadCount(
    conversationId: string,
    excludeUserId: string
  ): Promise<void> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return;

    const participants = [
      conversation.customerUserId?.toString(),
      conversation.sellerUserId?.toString(),
      conversation.staffUserId?.toString(),
    ].filter((id) => id && id !== excludeUserId);

    const updateQuery: Record<string, number> = {};
    for (const participantId of participants) {
      if (participantId) {
        updateQuery[`unreadCount.${participantId}`] = 1;
      }
    }

    if (Object.keys(updateQuery).length > 0) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $inc: updateQuery,
      });
    }
  }

  /**
   * Mark conversation as read for a user
   */
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    // Also mark messages as read
    await Message.updateMany(
      {
        conversationId,
        senderUserId: { $ne: userId },
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
        $addToSet: { readBy: userId },
      }
    );
  }

  /**
   * Update conversation status
   */
  async updateStatus(
    conversationId: string,
    status: ConversationStatus,
    userId: string,
    userRole: string
  ): Promise<IConversation> {
    // Verify access first
    await this.getConversationById(conversationId, userId, userRole);

    if (status === "Blocked" && userRole !== "ADMIN" && userRole !== "MODERATOR") {
      throw new AppError("Only staff can block conversations", 403);
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { status },
      { new: true }
    );

    if (!updated) {
      throw new AppError("Failed to update conversation", 500);
    }

    return updated;
  }

  /**
   * Update last message info
   */
  async updateLastMessage(
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessageAt: new Date(),
      lastMessagePreview: messagePreview.slice(0, 100),
    });
  }

  /**
   * Assign staff to conversation
   */
  async assignStaff(
    conversationId: string,
    staffUserId: string
  ): Promise<IConversation> {
    const staff = await User.findById(staffUserId);
    if (!staff) {
      throw new AppError("Staff user not found", 404);
    }

    const updated = await Conversation.findByIdAndUpdate(
      conversationId,
      { staffUserId },
      { new: true }
    );

    if (!updated) {
      throw new AppError("Conversation not found", 404);
    }

    return updated;
  }

  /**
   * Get unread count for user across all conversations
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    const conversations = await Conversation.find({
      $or: [
        { customerUserId: userId },
        { sellerUserId: userId },
        { staffUserId: userId },
      ],
      status: "Open",
    });

    let total = 0;
    for (const conv of conversations) {
      // Access Map value - unreadCount is stored as Map in Mongoose
      const unreadMap = conv.unreadCount as unknown as Map<string, number> | undefined;
      const unread = unreadMap?.get(userId) ?? 0;
      total += unread;
    }

    return total;
  }
}

export const conversationService = new ConversationService();
