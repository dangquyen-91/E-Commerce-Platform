import { Shop, OrderItem, Review } from "@/models";
import {
  DateRangeQuery,
  SellerDashboardResponse,
  SellerRevenueResponse,
  SellerRevenueTrendResponse,
  SellerOrderOverviewResponse,
} from "@/types/report.types";
import mongoose from "mongoose";

const PLATFORM_FEE_RATE = 0.05; // 5%

export class SellerReportService {
  // ============ HELPER METHODS ============

  private getDateGroupKey(granularity: "day" | "week" | "month", dateField: string = "$createdAt") {
    switch (granularity) {
      case "day":
        return {
          year: { $year: dateField },
          month: { $month: dateField },
          day: { $dayOfMonth: dateField },
        };
      case "week":
        return {
          year: { $isoWeekYear: dateField },
          week: { $isoWeek: dateField },
        };
      case "month":
        return {
          year: { $year: dateField },
          month: { $month: dateField },
        };
    }
  }

  private getStartOfDay(date: Date): Date {
    // Convert to Vietnam timezone (UTC+7) then get start of day
    const vnOffset = 7 * 60 * 60 * 1000; // 7 hours in ms
    const vnTime = new Date(date.getTime() + vnOffset);
    vnTime.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC for MongoDB query
    return new Date(vnTime.getTime() - vnOffset);
  }

  private getStartOfWeek(date: Date): Date {
    // Convert to Vietnam timezone (UTC+7)
    const vnOffset = 7 * 60 * 60 * 1000;
    const vnTime = new Date(date.getTime() + vnOffset);
    const day = vnTime.getUTCDay();
    const diff = vnTime.getUTCDate() - day + (day === 0 ? -6 : 1);
    vnTime.setUTCDate(diff);
    vnTime.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC for MongoDB query
    return new Date(vnTime.getTime() - vnOffset);
  }

  private getStartOfMonth(date: Date): Date {
    // Convert to Vietnam timezone (UTC+7)
    const vnOffset = 7 * 60 * 60 * 1000;
    const vnTime = new Date(date.getTime() + vnOffset);
    vnTime.setUTCDate(1);
    vnTime.setUTCHours(0, 0, 0, 0);
    // Convert back to UTC for MongoDB query
    return new Date(vnTime.getTime() - vnOffset);
  }

  /**
   * Get shop by owner user ID
   */
  async getShopByOwner(userId: string): Promise<any> {
    const shop = await Shop.findOne({
      ownerUserId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
    });
    return shop;
  }

  // ============ SELLER DASHBOARD ============

  async getSellerDashboard(userId: string): Promise<SellerDashboardResponse> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new Error("Shop not found for this user");
    }

    const shopId = shop._id;
    const now = new Date();
    const startOfToday = this.getStartOfDay(now);
    const startOfWeek = this.getStartOfWeek(now);
    const startOfMonth = this.getStartOfMonth(now);

    const [
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingPayout,
      totalReceived,
      todayOrders,
      pendingDelivery,
      completedOrders,
      reviewStats,
    ] = await Promise.all([
      // Today revenue (from order items that belong to this shop, in paid orders)
      OrderItem.aggregate([
        { $match: { shopId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        {
          $match: {
            "order.status": { $in: ["Paid", "Completed"] },
            "order.paidAt": { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),
      // Week revenue
      OrderItem.aggregate([
        { $match: { shopId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        {
          $match: {
            "order.status": { $in: ["Paid", "Completed"] },
            "order.paidAt": { $gte: startOfWeek },
          },
        },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),
      // Month revenue
      OrderItem.aggregate([
        { $match: { shopId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        {
          $match: {
            "order.status": { $in: ["Paid", "Completed"] },
            "order.paidAt": { $gte: startOfMonth },
          },
        },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),
      // Pending payout (currently in escrow)
      OrderItem.aggregate([
        { $match: { shopId, holdStatus: "Holding" } },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
      // Total received (released - seller portion after platform fee)
      OrderItem.aggregate([
        { $match: { shopId, holdStatus: "Released" } },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
      // Today orders
      OrderItem.aggregate([
        { $match: { shopId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        { $match: { "order.createdAt": { $gte: startOfToday } } },
        { $count: "count" },
      ]),
      // Pending delivery
      OrderItem.countDocuments({ shopId, itemStatus: "WaitingDelivery" }),
      // Completed orders
      OrderItem.countDocuments({ shopId, itemStatus: "Completed" }),
      // Review stats
      Review.aggregate([
        { $match: { shopId, status: "Visible" } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalReceivedAmount = totalReceived[0]?.total || 0;
    const sellerReceived = Math.round(totalReceivedAmount * (1 - PLATFORM_FEE_RATE));

    return {
      snapshot: { timestamp: now },
      shopId: shopId.toString(),
      shopName: shop.shopName,
      revenue: {
        todayRevenue: todayRevenue[0]?.total || 0,
        weekRevenue: weekRevenue[0]?.total || 0,
        monthRevenue: monthRevenue[0]?.total || 0,
        pendingPayout: pendingPayout[0]?.total || 0,
        totalReceived: sellerReceived,
      },
      orders: {
        todayOrders: todayOrders[0]?.count || 0,
        pendingDelivery,
        completed: completedOrders,
      },
      rating: {
        average: Math.round((reviewStats[0]?.avgRating || 0) * 100) / 100,
        totalReviews: reviewStats[0]?.totalReviews || 0,
      },
    };
  }

  // ============ SELLER REVENUE ============

  async getSellerRevenueOverview(
    userId: string,
    dateRange: DateRangeQuery
  ): Promise<SellerRevenueResponse> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new Error("Shop not found for this user");
    }

    const shopId = shop._id;
    const { startDate, endDate } = dateRange;

    const [salesStats, releasedStats, refundedStats, holdingStats] = await Promise.all([
      // Total sales in period
      OrderItem.aggregate([
        { $match: { shopId } },
        {
          $lookup: {
            from: "orders",
            localField: "orderId",
            foreignField: "_id",
            as: "order",
          },
        },
        { $unwind: "$order" },
        {
          $match: {
            "order.status": { $in: ["Paid", "Completed"] },
            "order.paidAt": { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, total: { $sum: "$subtotal" } } },
      ]),
      // Released in period
      OrderItem.aggregate([
        {
          $match: {
            shopId,
            holdStatus: "Released",
            releaseAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
      // Refunded in period
      OrderItem.aggregate([
        {
          $match: {
            shopId,
            holdStatus: "Refunded",
            releaseAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
      // Currently holding
      OrderItem.aggregate([
        { $match: { shopId, holdStatus: "Holding" } },
        { $group: { _id: null, total: { $sum: "$holdAmount" } } },
      ]),
    ]);

    const totalSales = salesStats[0]?.total || 0;
    const released = releasedStats[0]?.total || 0;
    const platformFee = Math.round(released * PLATFORM_FEE_RATE);
    const netRevenue = released - platformFee;

    return {
      period: { startDate, endDate },
      shopId: shopId.toString(),
      totalSales,
      platformFee,
      netRevenue,
      pendingInEscrow: holdingStats[0]?.total || 0,
      released,
      refunded: refundedStats[0]?.total || 0,
    };
  }

  async getSellerRevenueTrends(
    userId: string,
    dateRange: DateRangeQuery
  ): Promise<SellerRevenueTrendResponse> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new Error("Shop not found for this user");
    }

    const shopId = shop._id;
    const { startDate, endDate, granularity = "day" } = dateRange;

    const result = await OrderItem.aggregate([
      { $match: { shopId } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.status": { $in: ["Paid", "Completed"] },
          "order.paidAt": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: this.getDateGroupKey(granularity, "$order.paidAt"),
          sales: { $sum: "$subtotal" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $project: {
          date: "$_id",
          sales: 1,
          platformFee: { $round: [{ $multiply: ["$sales", PLATFORM_FEE_RATE] }, 0] },
          netRevenue: { $round: [{ $multiply: ["$sales", 1 - PLATFORM_FEE_RATE] }, 0] },
          orderCount: 1,
        },
      },
      { $sort: { "date.year": 1, "date.month": 1, "date.day": 1 } },
    ]);

    return {
      period: { startDate, endDate },
      granularity,
      shopId: shopId.toString(),
      data: result,
    };
  }

  // ============ SELLER ORDERS ============

  async getSellerOrderOverview(
    userId: string,
    dateRange: DateRangeQuery
  ): Promise<SellerOrderOverviewResponse> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new Error("Shop not found for this user");
    }

    const shopId = shop._id;
    const { startDate, endDate } = dateRange;

    const result = await OrderItem.aggregate([
      { $match: { shopId } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.createdAt": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalAmount: { $sum: "$subtotal" },
                averageOrderValue: { $avg: "$subtotal" },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$itemStatus",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const data = result[0];
    const totals = data.totals[0] || { totalOrders: 0, totalAmount: 0, averageOrderValue: 0 };
    const totalOrders = totals.totalOrders;

    const statusMap: Record<string, number> = {
      WaitingDelivery: 0,
      Delivered: 0,
      Completed: 0,
      Disputed: 0,
      Refunded: 0,
    };

    data.byStatus.forEach((s: any) => {
      statusMap[s._id] = s.count;
    });

    const byStatus = Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
      percentage: totalOrders > 0 ? Math.round((count / totalOrders) * 100 * 100) / 100 : 0,
    }));

    return {
      period: { startDate, endDate },
      shopId: shopId.toString(),
      totalOrders,
      totalAmount: totals.totalAmount,
      averageOrderValue: Math.round(totals.averageOrderValue || 0),
      byStatus,
    };
  }

  async getSellerOrderTrends(userId: string, dateRange: DateRangeQuery): Promise<any> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new Error("Shop not found for this user");
    }

    const shopId = shop._id;
    const { startDate, endDate, granularity = "day" } = dateRange;

    const result = await OrderItem.aggregate([
      { $match: { shopId } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $match: {
          "order.createdAt": { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: this.getDateGroupKey(granularity, "$order.createdAt"),
          orderCount: { $sum: 1 },
          totalAmount: { $sum: "$subtotal" },
          averageOrderValue: { $avg: "$subtotal" },
        },
      },
      {
        $project: {
          date: "$_id",
          orderCount: 1,
          totalAmount: 1,
          averageOrderValue: { $round: ["$averageOrderValue", 0] },
        },
      },
      { $sort: { "date.year": 1, "date.month": 1, "date.day": 1 } },
    ]);

    return {
      period: { startDate, endDate },
      granularity,
      shopId: shopId.toString(),
      data: result,
    };
  }
}

export const sellerReportService = new SellerReportService();
