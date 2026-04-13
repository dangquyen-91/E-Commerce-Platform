/**
 * Support Ticket Service
 * Handles support ticket operations
 * NOTE: Backend APIs need to be implemented
 */

import { apiClient } from "../api";
import type { SupportTicket } from "@/types";

export interface CreateTicketRequest {
  orderItemId?: string;
  title: string;
  content: string;
  category: "invalid_key" | "activation_fail" | "refund_request" | "technical" | "other";
}

export interface ReplyTicketRequest {
  ticketId: string;
  message: string;
  isInternal?: boolean;
}

export interface TicketFilter {
  status?: string;
  page?: number;
  limit?: number;
}

export interface TicketsResponse {
  tickets: SupportTicket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class TicketService {
  /**
   * Create a new support ticket
   * NOTE: Backend API needs to be implemented - POST /api/tickets
   */
  async createTicket(data: CreateTicketRequest): Promise<SupportTicket> {
    const response = await apiClient.post<SupportTicket>("/tickets", data);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to create ticket");
  }

  /**
   * Get customer's tickets
   * NOTE: Backend API needs to be implemented - GET /api/tickets
   */
  async getMyTickets(filter: TicketFilter = {}): Promise<TicketsResponse> {
    const params = new URLSearchParams();
    
    if (filter.status) params.append("status", filter.status);
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.limit) params.append("limit", filter.limit.toString());

    const queryString = params.toString();
    const url = `/tickets${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<SupportTicket[]>(url);

    if (response.success && response.data) {
      return {
        tickets: response.data,
        pagination: (response as any).pagination || {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: response.data.length,
          totalPages: 1,
        },
      };
    }

    throw new Error(response.message || "Failed to get tickets");
  }

  /**
   * Get ticket by ID
   * NOTE: Backend API needs to be implemented - GET /api/tickets/:ticketId
   */
  async getTicketById(ticketId: string): Promise<SupportTicket> {
    const response = await apiClient.get<SupportTicket>(`/tickets/${ticketId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to get ticket");
  }

  /**
   * Reply to ticket
   * NOTE: Backend API needs to be implemented - POST /api/tickets/:ticketId/reply
   */
  async replyTicket(data: ReplyTicketRequest): Promise<void> {
    const response = await apiClient.post(`/tickets/${data.ticketId}/reply`, {
      message: data.message,
      isInternal: data.isInternal || false,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to reply ticket");
    }
  }

  /**
   * Close ticket
   * NOTE: Backend API needs to be implemented - POST /api/tickets/:ticketId/close
   */
  async closeTicket(ticketId: string): Promise<void> {
    const response = await apiClient.post(`/tickets/${ticketId}/close`, {});

    if (!response.success) {
      throw new Error(response.message || "Failed to close ticket");
    }
  }
}

export const ticketService = new TicketService();
