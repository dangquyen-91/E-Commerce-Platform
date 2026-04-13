/**
 * Report Types - TypeScript interfaces for admin and seller reports
 */

// Date range query parameters
export interface DateRangeQuery {
  startDate: Date;
  endDate: Date;
  granularity?: "day" | "week" | "month";
}

// Pagination options
export interface ReportPagination {
  limit?: number;
  skip?: number;
}

// ============ REVENUE REPORTS ============

export interface RevenueOverviewResponse {
  period: { startDate: Date; endDate: Date };
  totalRevenue: number;
  platformFeeCollected: number;
  sellerPayouts: number;
  pendingInEscrow: number;
  refundedAmount: number;
}

export interface PlatformFeeResponse {
  period: { startDate: Date; endDate: Date };
  breakdown: {
    date: any;
    totalReleased: number;
    platformFee: number;
    sellerReceived: number;
    transactionCount: number;
  }[];
  totals: {
    totalReleased: number;
    platformFee: number;
    transactionCount: number;
  };
}

export interface RevenueTrendResponse {
  period: { startDate: Date; endDate: Date };
  granularity: string;
  data: {
    date: any;
    totalRevenue: number;
    totalFees: number;
    orderCount: number;
    averageOrderValue: number;
  }[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  };
}

// ============ ORDER REPORTS ============

export interface OrderOverviewResponse {
  period: { startDate: Date; endDate: Date };
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
}

export interface OrderStatusResponse {
  period: { startDate: Date; endDate: Date };
  byStatus: {
    status: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }[];
  total: number;
}

export interface OrderTrendResponse {
  period: { startDate: Date; endDate: Date };
  granularity: string;
  data: {
    date: any;
    orderCount: number;
    totalAmount: number;
    averageOrderValue: number;
  }[];
}

export interface PaymentMethodResponse {
  period: { startDate: Date; endDate: Date };
  distribution: {
    provider: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }[];
  total: number;
}

// ============ COMPLAINT REPORTS ============

export interface ComplaintOverviewResponse {
  period: { startDate: Date; endDate: Date };
  totalComplaints: number;
  openComplaints: number;
  resolvedComplaints: number;
  avgResolutionTimeMinutes: number;
  byStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  byCategory: {
    category: string;
    count: number;
    percentage: number;
  }[];
}

export interface ComplaintTrendResponse {
  period: { startDate: Date; endDate: Date };
  granularity: string;
  data: {
    date: any;
    newComplaints: number;
    resolvedComplaints: number;
  }[];
}

export interface ResolutionStatsResponse {
  period: { startDate: Date; endDate: Date };
  resolutionBreakdown: {
    type: string;
    count: number;
    totalRefundAmount: number;
  }[];
  resolutionTime: {
    avgMinutes: number;
    minMinutes: number;
    maxMinutes: number;
  };
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
}

export interface SLAComplianceResponse {
  period: { startDate: Date; endDate: Date };
  slaTargets: {
    firstResponseHours: number;
    resolutionHours: number;
  };
  metrics: {
    totalTickets: number;
    slaBreachedCount: number;
    slaComplianceRate: number;
    avgFirstResponseHours: number;
    avgResolutionHours: number;
    firstResponseSLARate: number;
    resolutionSLARate: number;
  };
}

// ============ DASHBOARD ============

export interface AdminDashboardResponse {
  snapshot: { timestamp: Date };
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

// ============ SELLER REPORTS ============

export interface SellerDashboardResponse {
  snapshot: { timestamp: Date };
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

export interface SellerRevenueResponse {
  period: { startDate: Date; endDate: Date };
  shopId: string;
  totalSales: number;
  platformFee: number;
  netRevenue: number;
  pendingInEscrow: number;
  released: number;
  refunded: number;
}

export interface SellerRevenueTrendResponse {
  period: { startDate: Date; endDate: Date };
  granularity: string;
  shopId: string;
  data: {
    date: any;
    sales: number;
    platformFee: number;
    netRevenue: number;
    orderCount: number;
  }[];
}

export interface SellerOrderOverviewResponse {
  period: { startDate: Date; endDate: Date };
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
  period: { startDate: Date; endDate: Date };
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
  period: { startDate: Date; endDate: Date };
  topByRevenue: ShopRankingItem[];
  topByComplaints: ShopRankingItem[];
  summary: {
    totalActiveShops: number;
    avgRating: number;
    totalComplaints: number;
  };
}
