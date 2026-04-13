/**
 * Chat Service
 * Handles conversations, messages, and support tickets
 * Includes debug logging for development
 */

import { apiClient } from "../api";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ChatService] ${action}`, data ?? "");
  }
};
const logError = (action: string, error: unknown) => {
  console.error(`[ChatService] ERROR ${action}:`, error);
};

// ==================== Types ====================

export type ConversationType = "OrderItem" | "Shop" | "Support";
export type ConversationStatus = "Open" | "Closed" | "Blocked";
export type MessageType = "Text" | "System" | "Attachment";
export type AttachmentType = "Image" | "File" | "None";
export type TicketStatus = "Open" | "InReview" | "NeedMoreInfo" | "Resolved" | "Closed";
export type TicketType = "Complaint" | "Dispute" | "General";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export interface User {
  _id: string;
  fullName: string;
  email?: string;
  avatar?: string;
}

export interface Shop {
  _id: string;
  name?: string;
  shopName?: string;
  logo?: string;
}

export interface Conversation {
  _id: string;
  type: ConversationType;
  customerUserId: User | string;
  sellerUserId?: User | string | null;
  staffUserId?: User | string | null;
  shopId?: Shop | string | null;
  orderItemId?: string | null;
  ticketId?: Ticket | string | null;
  status: ConversationStatus;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface MessageAttachment {
  url: string;
  type: string; // MIME type (e.g., "image/png", "application/pdf")
  fileName?: string;
  fileSize?: number;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderUserId: User | string;
  messageType: MessageType;
  body?: string | null;
  attachmentUrl?: string | null;
  attachmentType?: AttachmentType;
  attachments?: MessageAttachment[];
  isInternal?: boolean;
  sentAt: string;
  readAt?: string | null;
  readBy?: string[];
  isDeleted?: boolean;
}

export interface Ticket {
  _id: string;
  ticketCode: string;
  customerUserId: User | string;
  orderItemId: string;
  title: string;
  content: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  assignedToUserId?: User | string | null;
  resolutionType: string;
  refundAmount?: number;
  decidedByUserId?: User | string | null;
  decisionNote?: string | null;
  decidedAt?: string | null;
  escalatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==================== Request/Response Types ====================

export interface CreateConversationRequest {
  type: ConversationType;
  shopId?: string;
  orderItemId?: string;
  ticketId?: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SendMessageRequest {
  conversationId: string;
  messageType: MessageType;
  body?: string;
  attachments?: MessageAttachment[];
  isInternal?: boolean;
}

export interface MessagesResponse {
  messages: Message[];
  total: number;
  hasMore: boolean;
}

export interface CreateTicketRequest {
  orderItemId: string;
  title: string;
  content: string;
  type?: TicketType;
  priority?: TicketPriority;
}

export interface UpdateTicketRequest {
  status?: TicketStatus;
  priority?: TicketPriority;
  assignedToUserId?: string;
  resolutionType?: string;
  refundAmount?: number;
  decisionNote?: string;
}

export interface TicketsResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}

export interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime: number;
}

// ==================== Chat Service ====================

class ChatService {
  // ==================== Conversations ====================

  /**
   * Create a new conversation
   */
  async createConversation(data: CreateConversationRequest): Promise<Conversation> {
    log("createConversation", data);
    try {
      const response = await apiClient.post<Conversation>("/support/conversations", data);
      log("createConversation response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create conversation");
    } catch (error) {
      logError("createConversation", error);
      throw error;
    }
  }

  /**
   * Get conversations list
   */
  async getConversations(params?: {
    type?: ConversationType;
    status?: ConversationStatus;
    page?: number;
    limit?: number;
  }): Promise<ConversationsResponse> {
    log("getConversations", params);
    try {
      const queryParams = new URLSearchParams();
      if (params?.type) queryParams.append("type", params.type);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const url = `/support/conversations${queryParams.toString() ? `?${queryParams}` : ""}`;
      const response = await apiClient.get<any>(url);
      log("getConversations response raw", response);

      if (response.success && response.data) {
        // Handle response where data is an array (from your screenshot)
        if (Array.isArray(response.data)) {
          const pagination = (response as any).pagination || {};
          return {
            conversations: response.data,
            total: pagination.total || response.data.length,
            page: pagination.page || 1,
            totalPages: pagination.totalPages || 1,
          };
        }
        // Handle existing expected format
        return response.data as ConversationsResponse;
      }
      // Return empty response if no data
      return { conversations: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
      logError("getConversations", error);
      throw error;
    }
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(id: string): Promise<Conversation> {
    log("getConversationById", id);
    try {
      const response = await apiClient.get<Conversation>(`/support/conversations/${id}`);
      log("getConversationById response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Conversation not found");
    } catch (error) {
      logError("getConversationById", error);
      throw error;
    }
  }

  /**
   * Update conversation status
   */
  async updateConversationStatus(id: string, status: ConversationStatus): Promise<Conversation> {
    log("updateConversationStatus", { id, status });
    try {
      const response = await apiClient.patch<Conversation>(`/support/conversations/${id}/status`, {
        status,
      });
      log("updateConversationStatus response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to update conversation");
    } catch (error) {
      logError("updateConversationStatus", error);
      throw error;
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(id: string): Promise<void> {
    log("markConversationAsRead", id);
    try {
      await apiClient.post(`/support/conversations/${id}/read`);
      log("markConversationAsRead success");
    } catch (error) {
      logError("markConversationAsRead", error);
      throw error;
    }
  }

  /**
   * Get total unread count
   */
  async getUnreadCount(): Promise<number> {
    log("getUnreadCount");
    try {
      const response = await apiClient.get<{ unreadCount: number }>(
        "/support/conversations/unread-count"
      );
      log("getUnreadCount response", response);
      if (response.success && response.data) {
        return response.data.unreadCount;
      }
      return 0;
    } catch (error) {
      logError("getUnreadCount", error);
      return 0;
    }
  }

  // ==================== Messages ====================

  /**
   * Send a message
   */
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    log("sendMessage", data);
    try {
      const response = await apiClient.post<Message>("/support/messages", data);
      log("sendMessage response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to send message");
    } catch (error) {
      logError("sendMessage", error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    params?: {
      page?: number;
      limit?: number;
      before?: string;
    }
  ): Promise<MessagesResponse> {
    log("getMessages", { conversationId, params });
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());
      if (params?.before) queryParams.append("before", params.before);

      const url = `/support/messages/${conversationId}${queryParams.toString() ? `?${queryParams}` : ""}`;
      const response = await apiClient.get<any>(url);
      log("getMessages response raw", response);

      if (response.success) {
        // BE hiện trả: { success: true, data: Message[], hasMore, total }
        if (Array.isArray(response.data)) {
          return {
            messages: response.data,
            total:
              typeof (response as { total?: number }).total === "number"
                ? (response as { total?: number }).total!
                : response.data.length,
            hasMore: !!(response as { hasMore?: boolean }).hasMore,
          };
        }

        // Fallback nếu BE trả theo format cũ: { data: { messages, total, hasMore } }
        if (response.data?.messages && Array.isArray(response.data.messages)) {
          return response.data as MessagesResponse;
      }
      }

      return { messages: [], total: 0, hasMore: false };
    } catch (error) {
      logError("getMessages", error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string): Promise<void> {
    log("deleteMessage", id);
    try {
      await apiClient.delete(`/support/messages/${id}`);
      log("deleteMessage success");
    } catch (error) {
      logError("deleteMessage", error);
      throw error;
    }
  }

  /**
   * Search messages
   */
  async searchMessages(query: string, limit?: number): Promise<Message[]> {
    log("searchMessages", { query, limit });
    try {
      const queryParams = new URLSearchParams({ q: query });
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get<Message[]>(`/support/messages/search?${queryParams}`);
      log("searchMessages response", { count: response.data?.length });
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      logError("searchMessages", error);
      throw error;
    }
  }

  // ==================== Tickets ====================

  /**
   * Create a support ticket
   */
  async createTicket(
    data: CreateTicketRequest
  ): Promise<{ ticket: Ticket; conversationId: string }> {
    log("createTicket", data);
    try {
      const response = await apiClient.post<{ ticket: Ticket; conversationId: string }>(
        "/support/tickets",
        data
      );
      log("createTicket response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to create ticket");
    } catch (error) {
      logError("createTicket", error);
      throw error;
    }
  }

  /**
   * Get tickets list
   */
  async getTickets(params?: {
    status?: TicketStatus;
    priority?: TicketPriority;
    type?: TicketType;
    assignedToUserId?: string;
    page?: number;
    limit?: number;
  }): Promise<TicketsResponse> {
    log("getTickets", params);
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      if (params?.priority) queryParams.append("priority", params.priority);
      if (params?.type) queryParams.append("type", params.type);
      if (params?.assignedToUserId) queryParams.append("assignedToUserId", params.assignedToUserId);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const url = `/support/tickets${queryParams.toString() ? `?${queryParams}` : ""}`;
      const response = await apiClient.get<TicketsResponse>(url);
      log("getTickets response", {
        success: response.success,
        count: response.data?.tickets?.length,
      });

      if (response.success && response.data) {
        return response.data;
      }
      return { tickets: [], total: 0, page: 1, totalPages: 0 };
    } catch (error) {
      logError("getTickets", error);
      throw error;
    }
  }

  /**
   * Get ticket by ID
   */
  async getTicketById(id: string): Promise<Ticket> {
    log("getTicketById", id);
    try {
      const response = await apiClient.get<Ticket>(`/support/tickets/${id}`);
      log("getTicketById response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Ticket not found");
    } catch (error) {
      logError("getTicketById", error);
      throw error;
    }
  }

  /**
   * Update ticket
   */
  async updateTicket(id: string, data: UpdateTicketRequest): Promise<Ticket> {
    log("updateTicket", { id, data });
    try {
      const response = await apiClient.patch<Ticket>(`/support/tickets/${id}`, data);
      log("updateTicket response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to update ticket");
    } catch (error) {
      logError("updateTicket", error);
      throw error;
    }
  }

  /**
   * Assign ticket to staff
   */
  async assignTicket(id: string, staffUserId: string): Promise<Ticket> {
    log("assignTicket", { id, staffUserId });
    try {
      const response = await apiClient.post<Ticket>(`/support/tickets/${id}/assign`, {
        staffUserId,
      });
      log("assignTicket response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to assign ticket");
    } catch (error) {
      logError("assignTicket", error);
      throw error;
    }
  }

  /**
   * Escalate ticket
   */
  async escalateTicket(id: string, reason?: string): Promise<Ticket> {
    log("escalateTicket", { id, reason });
    try {
      const response = await apiClient.post<Ticket>(`/support/tickets/${id}/escalate`, { reason });
      log("escalateTicket response", response);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || "Failed to escalate ticket");
    } catch (error) {
      logError("escalateTicket", error);
      throw error;
    }
  }

  /**
   * Get ticket statistics
   */
  async getTicketStats(): Promise<TicketStats> {
    log("getTicketStats");
    try {
      const response = await apiClient.get<TicketStats>("/support/tickets/stats");
      log("getTicketStats response", response);
      if (response.success && response.data) {
        return response.data;
      }
      return { total: 0, byStatus: {}, byPriority: {}, avgResolutionTime: 0 };
    } catch (error) {
      logError("getTicketStats", error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
export default chatService;
