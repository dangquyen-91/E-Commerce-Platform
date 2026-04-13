import apiClient from "@/lib/api";
import type {
  DisbursementStats,
  DisbursementResponse,
  HoldingItem,
  PaginatedResponse,
  PendingItem,
} from "@/types/disbursement";

export const disbursementService = {
  getStats: async (): Promise<DisbursementStats> => {
    const res = await apiClient.get<DisbursementStats>("/disbursement/stats");
    if (!res.success || !res.data) throw new Error(res.message || "Failed to load stats");
    return res.data;
  },

  getHolding: async (params?: {
    limit?: number;
    skip?: number;
    shopId?: string;
  }): Promise<PaginatedResponse<HoldingItem>> => {
    const res = await apiClient.get<PaginatedResponse<HoldingItem>>("/disbursement/holding", {
      params,
    });
    if (!res.success || !res.data) throw new Error(res.message || "Failed to load holding items");
    return res.data;
  },

  getPending: async (params?: {
    limit?: number;
    skip?: number;
  }): Promise<PaginatedResponse<PendingItem>> => {
    const res = await apiClient.get<PaginatedResponse<PendingItem>>("/disbursement/pending", {
      params,
    });
    if (!res.success || !res.data) throw new Error(res.message || "Failed to load pending items");
    return res.data;
  },

  triggerDisbursement: async (itemId: string): Promise<{ success: boolean; message?: string }> => {
    const res = await apiClient.post<unknown>(`/disbursement/${encodeURIComponent(itemId)}`);
    return { success: !!res.success, message: res.message };
  },
};
