import { BaseService } from "@/services/base.service";
import { Message, IMessage, Conversation, User } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { MessageType, AttachmentType } from "@/types";
import { conversationService } from "./conversation.service";
import mongoose from "mongoose";

export interface CreateMessageDTO {
  conversationId: string;
  senderUserId: string;
  messageType: MessageType;
  body?: string;
  attachments?: Array<{
    url: string;
    type: AttachmentType;
    fileName?: string;
    fileSize?: number;
  }>;
  isInternal?: boolean; // For staff internal notes
}

export interface MessageListQuery {
  conversationId: string;
  userId: string;
  userRole: string;
  page?: number;
  limit?: number;
  before?: Date; // For infinite scroll - get messages before this timestamp
}

export class MessageService extends BaseService<IMessage> {
  constructor() {
    super(Message);
  }

  /**
   * Send a new message
   */
  async sendMessage(data: CreateMessageDTO): Promise<IMessage> {
    const {
      conversationId,
      senderUserId,
      messageType,
      body,
      attachments,
      isInternal = false,
    } = data;

    // Verify conversation exists and is open
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    if (conversation.status === "Closed") {
      throw new AppError("Cannot send message to closed conversation", 400);
    }

    if (conversation.status === "Blocked") {
      throw new AppError("This conversation has been blocked", 400);
    }

    // Verify sender exists
    const sender = await User.findById(senderUserId);
    if (!sender) {
      throw new AppError("Sender not found", 404);
    }

    // Check sender has access to conversation
    const senderRole = sender.roleId?.toString(); // Need to populate or check role
    const hasAccess = conversationService.checkConversationAccess(
      conversation,
      senderUserId,
      senderRole || "CUSTOMER"
    );

    if (!hasAccess) {
      throw new AppError("You do not have access to this conversation", 403);
    }

    // Validate message content
    if (messageType === "Text" && (!body || body.trim() === "")) {
      throw new AppError("Message body is required for text messages", 400);
    }

    if (messageType === "Attachment" && (!attachments || attachments.length === 0)) {
      throw new AppError("Attachments are required for attachment messages", 400);
    }

    // Only staff can send internal notes
    if (isInternal && !["ADMIN", "MODERATOR"].includes(senderRole || "")) {
      throw new AppError("Only staff can send internal notes", 403);
    }

    // Prepare attachment data
    const attachmentUrl = attachments?.[0]?.url || null;
    const attachmentType = attachments?.[0]?.type || "None";

    // Create message
    const message = await Message.create({
      conversationId,
      senderUserId,
      messageType,
      body: body || null,
      attachmentUrl,
      attachmentType,
      attachments: attachments || [],
      isInternal,
      sentAt: new Date(),
      readBy: [senderUserId], // Sender has read their own message
    });

    // Update conversation
    const messagePreview = this.getMessagePreview(message);
    await Promise.all([
      conversationService.updateLastMessage(conversationId, messagePreview),
      conversationService.incrementUnreadCount(conversationId, senderUserId),
    ]);

    return message;
  }

  /**
   * Get messages for a conversation with pagination
   */
  async getMessages(query: MessageListQuery): Promise<{
    messages: IMessage[];
    total: number;
    hasMore: boolean;
  }> {
    const { conversationId, userId, userRole, page = 1, limit = 50, before } = query;

    // Verify access
    await conversationService.getConversationById(
      conversationId,
      userId,
      userRole
    );

    const filter: Record<string, unknown> = {
      conversationId,
      isDeleted: false,
    };

    // Non-staff users cannot see internal notes
    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      filter.isInternal = false;
    }

    // For infinite scroll - get messages before timestamp
    if (before) {
      filter.sentAt = { $lt: before };
    }

    const skip = before ? 0 : (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find(filter)
        .populate("senderUserId", "fullName avatar")
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(limit + 1) // Fetch one extra to check if there are more
        .lean(),
      Message.countDocuments(filter),
    ]);

    const hasMore = messages.length > limit;
    const resultMessages = messages.slice(0, limit).reverse(); // Return in chronological order

    // Mark messages as read
    await conversationService.markAsRead(conversationId, userId);

    return {
      messages: resultMessages as IMessage[],
      total,
      hasMore,
    };
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    messageId: string,
    userId: string,
    userRole: string
  ): Promise<IMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new AppError("Message not found", 404);
    }

    // Only sender or staff can delete
    const isSender = message.senderUserId.toString() === userId;
    const isStaff = userRole === "ADMIN" || userRole === "MODERATOR";

    if (!isSender && !isStaff) {
      throw new AppError("You cannot delete this message", 403);
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { isDeleted: true },
      { new: true }
    );

    if (!updated) {
      throw new AppError("Failed to delete message", 500);
    }

    return updated;
  }

  /**
   * Mark specific messages as read
   */
  async markMessagesAsRead(
    messageIds: string[],
    userId: string
  ): Promise<void> {
    await Message.updateMany(
      {
        _id: { $in: messageIds },
        senderUserId: { $ne: userId },
      },
      {
        $set: { readAt: new Date() },
        $addToSet: { readBy: userId },
      }
    );
  }

  /**
   * Get unread message count for a conversation
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    return Message.countDocuments({
      conversationId,
      senderUserId: { $ne: userId },
      isDeleted: false,
      readBy: { $ne: new mongoose.Types.ObjectId(userId) },
    });
  }

  /**
   * Create a system message
   */
  async createSystemMessage(
    conversationId: string,
    body: string
  ): Promise<IMessage> {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    // Use system as sender (first admin or use customer as placeholder)
    const systemUser = await User.findOne({}).lean();
    if (!systemUser) {
      throw new AppError("No user found for system message", 500);
    }

    const message = await Message.create({
      conversationId,
      senderUserId: systemUser._id,
      messageType: "System",
      body,
      attachmentType: "None",
      attachments: [],
      isInternal: false,
      sentAt: new Date(),
    });

    await conversationService.updateLastMessage(conversationId, body);

    return message;
  }

  /**
   * Get message preview for conversation list
   */
  private getMessagePreview(message: IMessage): string {
    if (message.messageType === "System") {
      return message.body || "System message";
    }

    if (message.messageType === "Attachment") {
      const attachmentCount = message.attachments?.length || 1;
      return `Sent ${attachmentCount} attachment${attachmentCount > 1 ? "s" : ""}`;
    }

    return message.body || "";
  }

  /**
   * Search messages in conversations
   */
  async searchMessages(
    userId: string,
    userRole: string,
    searchTerm: string,
    limit: number = 20
  ): Promise<IMessage[]> {
    // Get user's conversations
    const conversations = await conversationService.getConversationsForUser({
      userId,
      userRole: userRole as "CUSTOMER" | "SELLER" | "ADMIN" | "MODERATOR",
      limit: 1000, // Get all conversations
    });

    const conversationIds = conversations.conversations.map((c) => c._id);

    const filter: Record<string, unknown> = {
      conversationId: { $in: conversationIds },
      isDeleted: false,
      body: { $regex: searchTerm, $options: "i" },
    };

    if (userRole !== "ADMIN" && userRole !== "MODERATOR") {
      filter.isInternal = false;
    }

    const messages = await Message.find(filter)
      .populate("senderUserId", "fullName avatar")
      .populate("conversationId")
      .sort({ sentAt: -1 })
      .limit(limit)
      .lean();

    return messages as IMessage[];
  }
}

export const messageService = new MessageService();
