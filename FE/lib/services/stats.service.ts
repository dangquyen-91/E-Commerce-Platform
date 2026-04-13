/**
 * Stats Service
 * Handles statistics API requests
 */

import { apiClient, type ApiResponse } from "../api";

export interface StatsResponse {
  totalProducts: number;
  totalTransactions: number;
  totalSellers: number;
}

class StatsService {
  /**
   * Get platform statistics
   */
  async getStats(): Promise<ApiResponse<StatsResponse>> {
    return apiClient.get<StatsResponse>("/stats");
  }
}

export const statsService = new StatsService();
