/**
 * Shop Service
 * Handles shop creation, management, and seller application status
 */

import { apiClient } from "../api";

export interface Shop {
  _id: string;
  ownerUserId: string;
  shopName: string;
  description?: string | null;
  status: "Pending" | "Active" | "Suspended" | "Closed";
  approvedByUserId?: string | null;
  approvedAt?: string | null;
  moderatorNote?: string | null;
  ratingAvg: number;
  reviewCount: number;
  responseRate: number; // Phần trăm phản hồi của shop (0-100)
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShopRequest {
  shopName: string;
  description?: string;
}

export interface ApproveShopRequest {
  moderatorNote?: string;
}

export interface RejectShopRequest {
  moderatorNote?: string;
}

export interface ShopStats {
  availableBalance: number;
  holdBalance: number;
  escrowAmount: number;
  paidOutAmount: number;
  totalOrders: number;
  weeklyOrders: number;
  avgRating: number;
  totalReviews: number;
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  inventory: {
    total: number;
    available: number;
    reserved: number;
    delivered: number;
  };
  totalSales: number;
}

class ShopService {
  /**
   * Create new shop (seller application)
   */
  async createShop(data: CreateShopRequest): Promise<Shop> {
    const response = await apiClient.post<Shop>("/shops", data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to create shop");
  }

  /**
   * Get current user's shop
   */
  async getMyShop(): Promise<Shop | null> {
    try {
      const response = await apiClient.get<Shop>("/shops/me/my-shop");
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return null;
    } catch (error: any) {
      // Return null if shop not found (user hasn't created shop yet)
      if (error?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get shop by ID
   */
  async getShopById(shopId: string): Promise<Shop> {
    const response = await apiClient.get<Shop>(`/shops/${shopId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get shop");
  }

  /**
   * Update shop
   */
  async updateShop(shopId: string, data: Partial<CreateShopRequest>): Promise<Shop> {
    const response = await apiClient.put<Shop>(`/shops/${shopId}`, data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to update shop");
  }

  /**
   * Get pending shop applications (Moderator only)
   */
  async getPendingShops(): Promise<Shop[]> {
    try {
      const response = await apiClient.get<Shop[]>("/shops/applications/pending");

      if (response.success && response.data) {
        return response.data;
      }

      return [];
    } catch {
      // Return empty array to prevent UI crash
      return [];
    }
  }

  /**
   * Approve shop (Moderator only)
   */
  async approveShop(shopId: string, data?: ApproveShopRequest): Promise<Shop> {
    const response = await apiClient.patch<Shop>(`/shops/${shopId}/approve`, data || {});
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to approve shop");
  }

  /**
   * Reject shop (Moderator only)
   */
  async rejectShop(shopId: string, data?: RejectShopRequest): Promise<Shop> {
    const response = await apiClient.patch<Shop>(`/shops/${shopId}/reject`, data || {});

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to reject shop");
  }

  /**
   * Get seller dashboard stats
   */
  async getMyShopStats(): Promise<ShopStats | null> {
    try {
      const response = await apiClient.get<ShopStats>("/shops/me/stats");

      if (response.success && response.data) {
        return response.data;
      }

      return null;
    } catch {
      return null;
    }
  }
}

export const shopService = new ShopService();
