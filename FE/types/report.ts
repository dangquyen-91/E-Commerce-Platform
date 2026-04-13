/**
 * Types for Reports (Admin and Seller)
 * Based on Backend response structures
 */

export interface DateRange {
  startDate: string | Date;
  endDate: string | Date;
}

export interface DateGroupKey {
  year: number;
  month: number;
  day?: number;
  week?: number;
}

// ============ ADMIN TYPES ============

export interface AdminDashboardResponse {
  snapshot: { timestamp: string };
  revenue: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    platformFeeToday: number;
  };
  orders: {
    todayOrders: number;
    pendingOrders: number;
    disputedOrders: number;
  };
  complaints: {
    openTickets: number;
    urgentTickets: number;
    avgResolutionHours: number;
    slaBreachedToday: number;
  };
  escrow: {
    totalHolding: number;
    readyForDisbursement: number;
    withComplaints: number;
  };
}

export interface RevenueOverview {
  period: DateRange;
  totalRevenue: number;
  platformFeeCollected: number;
  sellerPayouts: number;
  pendingInEscrow: number;
  refundedAmount: number;
}

export interface RevenueTrendItem {
  date: DateGroupKey;
  totalRevenue: number;
  totalFees: number;
  orderCount: number;
  averageOrderValue: number;
}

export interface RevenueTrendResponse {
  period: DateRange;
  granularity: "day" | "week" | "month";
  data: RevenueTrendItem[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  };
}

export interface OrderStatusItem {
  status: string;
  count: number;
  totalAmount: number;
  percentage: number;
}

export interface OrderStatusResponse {
  period: DateRange;
  byStatus: OrderStatusItem[];
  total: number;
}

export interface OrderTrendItem {
  date: DateGroupKey;
  orderCount: number;
  totalAmount: number;
  averageOrderValue: number;
}

export interface OrderTrendResponse {
  period: DateRange;
  granularity: "day" | "week" | "month";
  data: OrderTrendItem[];
}

export interface ModeratorPerformanceItem {
  moderatorId: string;
  moderatorName: string;
  moderatorEmail: string;
  totalAssigned: number;
  totalResolved: number;
  totalEscalated: number;
  resolutionRate: number;
  avgResolutionTimeMinutes: number;
  avgFirstResponseTimeMinutes: number;
  fullRefunds: number;
  partialRefunds: number;
  rejections: number;
  slaBreaches: number;
  slaComplianceRate: number;
  appealOverturnRate: number;
  avgSatisfactionScore: number;
}

export interface ModeratorPerformanceResponse {
  period: DateRange;
  moderators: ModeratorPerformanceItem[];
  summary: {
    totalModerators: number;
    totalTicketsAssigned: number;
    totalTicketsResolved: number;
    avgResolutionRate: number;
  };
}

// ============ SELLER TYPES ============

export interface SellerDashboardResponse {
  snapshot: { timestamp: string };
  shopId: string;
  shopName: string;
  revenue: {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    pendingPayout: number;
    totalReceived: number;
  };
  orders: {
    todayOrders: number;
    pendingDelivery: number;
    completed: number;
  };
  rating: {
    average: number;
    totalReviews: number;
  };
}

export interface SellerRevenueTrendItem {
  date: DateGroupKey;
  sales: number;
  platformFee: number;
  netRevenue: number;
  orderCount: number;
}

export interface SellerRevenueTrendResponse {
  period: DateRange;
  granularity: "day" | "week" | "month";
  shopId: string;
  data: SellerRevenueTrendItem[];
}

export interface SellerOrderOverviewResponse {
  period: DateRange;
  shopId: string;
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
}

// ============ TOP SELLING PRODUCTS ============

export interface TopSellingProductItem {
  productId: string;
  productName: string;
  shopId: string;
  shopName: string;
  thumbnail: string | null;
  totalQuantitySold: number;
  totalRevenue: number;
  orderCount: number;
  avgPrice: number;
}

export interface TopSellingProductsResponse {
  period: DateRange;
  products: TopSellingProductItem[];
  summary: {
    totalProductsSold: number;
    totalRevenue: number;
    totalOrders: number;
  };
}

// ============ SHOP RANKINGS ============

export interface ShopRankingItem {
  shopId: string;
  shopName: string;
  revenue: number;
  orderCount: number;
  complaintCount: number;
  rating: number;
  status: string;
}

export interface ShopRankingResponse {
  period: DateRange;
  topByRevenue: ShopRankingItem[];
  topByComplaints: ShopRankingItem[];
  summary: {
    totalActiveShops: number;
    avgRating: number;
    totalComplaints: number;
  };
}
