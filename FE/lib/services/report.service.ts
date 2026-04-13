import { apiClient, ApiResponse } from "@/lib/api";
import * as T from "@/types/report";

export const reportService = {
  // ============ ADMIN REPORTS ============

  getDashboard: async (): Promise<ApiResponse<T.AdminDashboardResponse>> => {
    return apiClient.get<T.AdminDashboardResponse>("/reports/dashboard");
  },

  getRevenueOverview: async (params: { startDate?: string; endDate?: string }): Promise<ApiResponse<T.RevenueOverview>> => {
    return apiClient.get<T.RevenueOverview>("/reports/revenue/overview", { params });
  },

  getRevenueTrends: async (params: { startDate?: string; endDate?: string; granularity?: string }): Promise<ApiResponse<T.RevenueTrendResponse>> => {
    return apiClient.get<T.RevenueTrendResponse>("/reports/revenue/trends", { params });
  },

  getOrdersByStatus: async (params: { startDate?: string; endDate?: string }): Promise<ApiResponse<T.OrderStatusResponse>> => {
    return apiClient.get<T.OrderStatusResponse>("/reports/orders/by-status", { params });
  },

  getOrderTrends: async (params: { startDate?: string; endDate?: string; granularity?: string }): Promise<ApiResponse<T.OrderTrendResponse>> => {
    return apiClient.get<T.OrderTrendResponse>("/reports/orders/trends", { params });
  },

  getModeratorPerformance: async (params: { startDate?: string; endDate?: string }): Promise<ApiResponse<T.ModeratorPerformanceResponse>> => {
    return apiClient.get<T.ModeratorPerformanceResponse>("/reports/complaints/moderator-performance", { params });
  },

  // ============ SELLER REPORTS ============

  getSellerDashboard: async (): Promise<ApiResponse<T.SellerDashboardResponse>> => {
    return apiClient.get<T.SellerDashboardResponse>("/seller/reports/dashboard");
  },

  getSellerRevenueTrends: async (params: { startDate?: string; endDate?: string; granularity?: string }): Promise<ApiResponse<T.SellerRevenueTrendResponse>> => {
    return apiClient.get<T.SellerRevenueTrendResponse>("/seller/reports/revenue/trends", { params });
  },

  getSellerOrderOverview: async (params: { startDate?: string; endDate?: string }): Promise<ApiResponse<T.SellerOrderOverviewResponse>> => {
    return apiClient.get<T.SellerOrderOverviewResponse>("/seller/reports/orders/overview", { params });
  },

  getSellerOrderTrends: async (params: { startDate?: string; endDate?: string; granularity?: string }): Promise<ApiResponse<T.OrderTrendResponse>> => {
    return apiClient.get<T.OrderTrendResponse>("/seller/reports/orders/trends", { params });
  },

  // ============ SHOP RANKINGS ============

  getShopRankings: async (params: { startDate?: string; endDate?: string; limit?: number }): Promise<ApiResponse<T.ShopRankingResponse>> => {
    return apiClient.get<T.ShopRankingResponse>("/reports/shops/rankings", { params });
  },

  // ============ TOP SELLING PRODUCTS ============

  getTopSellingProducts: async (params: { startDate?: string; endDate?: string; limit?: number }): Promise<ApiResponse<T.TopSellingProductsResponse>> => {
    return apiClient.get<T.TopSellingProductsResponse>("/reports/products/top-selling", { params });
  },
};
