/**
 * Order Service
 * Handles order operations for customers
 * NOTE: Backend APIs need to be implemented
 */

import { apiClient, type ApiResponse } from "../api";
import type { Order } from "@/types";

export interface OrderFilter {
  status?: string;
  page?: number;
  limit?: number;
  sort?: "createdAt" | "totalAmount";
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerStats {
  totalOrders: number;
  activeOrders: number;
  totalSpent: number;
  pendingTickets: number;
  reviewsGiven: number;
}

export interface SellerOrderItem {
  // IDs for reference (useful for dispute resolution)
  id: string;
  orderId?: string | null;
  inventoryItemId?: string | null;

  // Order info
  orderCode: string;
  orderCreatedAt: string;
  orderStatus?: string;

  // Customer info (enhanced for dispute resolution)
  customer: {
    id: string;
    email: string;
    fullName: string;
    phone?: string | null; // Phone for dispute contact
  } | null;

  // Product info
  product: {
    id: string;
    title: string;
    planType: string;
    durationDays: number;
    thumbnailUrl?: string | null;
  } | null;

  // Pricing
  quantity: number;
  unitPrice: number;
  subtotal: number;

  // Status and escrow
  itemStatus: string;
  holdStatus: string;
  holdAmount: number;

  // Important dates for dispute resolution
  createdAt: string;
  deliveredAt?: string | null;
  safeUntil?: string | null; // Warranty deadline - important for disputes!
  holdAt?: string | null;
  releaseAt?: string | null;

  // The actual credential/key
  credential?: string | null;

  // Secret type for display
  secretType?: string | null;
}

export interface SellerOrderItemsResponse {
  items: SellerOrderItem[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
  };
}

class OrderService {
  /**
   * Get customer's orders
   * NOTE: Backend API needs to be implemented - GET /api/orders
   */
  async getMyOrders(filter: OrderFilter = {}): Promise<OrdersResponse> {
    const params = new URLSearchParams();
    
    if (filter.status) params.append("status", filter.status);
    if (filter.page) params.append("page", filter.page.toString());
    if (filter.limit) params.append("limit", filter.limit.toString());
    if (filter.sort) params.append("sort", filter.sort);

    const queryString = params.toString();
    const url = `/orders${queryString ? `?${queryString}` : ""}`;

    const response = await apiClient.get<Order[]>(url);

    if (response.success && response.data) {
      const responseWithPagination = response as ApiResponse<Order[]> & {
        pagination?: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
      
      return {
        orders: response.data,
        pagination: responseWithPagination.pagination || {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: response.data.length,
          totalPages: 1,
        },
      };
    }

    throw new Error(response.message || "Failed to get orders");
  }

  /**
   * Get order by ID
   * NOTE: Backend API needs to be implemented - GET /api/orders/:orderId
   */
  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/orders/${orderId}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to get order");
  }

  /**
   * Get order by order code
   * GET /api/orders/code/:orderCode
   */
  async getOrderByCode(orderCode: string): Promise<{
    order: any;
    items: any[];
  }> {
    const response = await apiClient.get<{ order: any; items: any[] }>(`/orders/code/${orderCode}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to get order");
  }

  /**
   * Create order from cart
   * NOTE: Backend API needs to be implemented - POST /api/orders
   */
  async createOrder(data: {
    items: Array<{ productId: string; quantity: number }>;
    paymentMethod: string;
  }): Promise<Order> {
    const response = await apiClient.post<Order>("/orders", data);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to create order");
  }

  /**
   * Get customer statistics
   * NOTE: Backend API needs to be implemented - GET /api/users/stats
   */
  async getCustomerStats(): Promise<CustomerStats> {
    const response = await apiClient.get<CustomerStats>("/users/stats");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to get customer stats");
  }

  /**
   * Get seller order items (sales history)
   * GET /api/orders/seller/items
   */
  async getSellerOrderItems(params?: {
    limit?: number;
    skip?: number;
    status?: string;
  }): Promise<SellerOrderItemsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.skip) searchParams.append("skip", params.skip.toString());
    if (params?.status) searchParams.append("status", params.status);

    const query = searchParams.toString();
    const url = `/orders/seller/items${query ? `?${query}` : ""}`;

    const response = await apiClient.get<SellerOrderItemsResponse>(url);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to get seller order items");
  }

  /**
   * Cancel order
   * NOTE: Backend API needs to be implemented - POST /api/orders/:orderId/cancel
   */
  async cancelOrder(orderId: string): Promise<void> {
    const response = await apiClient.post(`/orders/${orderId}/cancel`, {});

    if (!response.success) {
      throw new Error(response.message || "Failed to cancel order");
    }
  }

  /**
   * Confirm order item delivery
   * NOTE: Backend API needs to be implemented - POST /api/orders/items/:itemId/confirm
   */
  async confirmDelivery(orderItemId: string, confirmed: boolean): Promise<void> {
    const response = await apiClient.post(`/orders/items/${orderItemId}/confirm`, {
      confirmed,
    });

    if (!response.success) {
      throw new Error(response.message || "Failed to confirm delivery");
    }
  }
}

export const orderService = new OrderService();
