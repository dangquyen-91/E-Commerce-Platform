import { Response, NextFunction, Request } from "express";
import { AuthRequest } from "@/middleware/auth";
import { disbursementService } from "@/services/disbursement/disbursement.service";
import { OrderItem, SupportTicket } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { env } from "@/config/env";

const ESCROW_PERIOD_HOURS = 72;

export class DisbursementController {
  /**
   * Process all pending disbursements (Cron job endpoint)
   * GET /api/cron/disbursement
   * Protected by CRON_SECRET
   */
  processPendingDisbursements = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Verify cron secret (for Vercel Cron or manual trigger)
      const cronSecret = req.headers["x-cron-secret"] || req.query.secret;
      const expectedSecret = env.CRON_SECRET || "default-cron-secret";

      if (cronSecret !== expectedSecret) {
        throw new AppError("Unauthorized", 401);
      }

      const result = await disbursementService.processAllPendingDisbursements();

      res.status(200).json({
        success: true,
        message: `Processed ${result.processed} items`,
        data: {
          processed: result.processed,
          succeeded: result.succeeded,
          failed: result.failed,
          errors: result.errors.slice(0, 10), // Limit errors in response
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get ALL holding items (Admin)
   * GET /api/disbursement/holding
   * Returns all items currently in escrow (regardless of time)
   */
  getAllHoldingItems = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit = 50, skip = 0, shopId } = req.query;

      // Build query
      const query: any = { holdStatus: "Holding" };
      if (shopId) query.shopId = shopId;

      // Find all items currently in holding
      const holdingItems = await OrderItem.find(query)
        .populate({
          path: "orderId",
          populate: {
            path: "customerUserId",
            select: "email fullName",
          },
        })
        .populate("shopId", "shopName ownerUserId")
        .populate("productId", "title")
        .populate("inventoryItemId", "sku")
        .sort({ holdAt: -1 }) // Newest first
        .limit(parseInt(limit as string, 10))
        .skip(parseInt(skip as string, 10));

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - ESCROW_PERIOD_HOURS);

      // Check for complaints and calculate time remaining
      const itemsWithDetails = await Promise.all(
        holdingItems.map(async (item) => {
          const hasComplaint = await SupportTicket.exists({
            orderItemId: item._id,
            status: { $in: ["Open", "InReview", "NeedMoreInfo", "ModeratorAssigned"] },
          });

          const order = item.orderId as any;
          const shop = item.shopId as any;
          const product = item.productId as any;
          const inventory = item.inventoryItemId as any;

          const holdAtTime = new Date(item.holdAt).getTime();
          const nowTime = new Date().getTime();
          const escrowEndTime = holdAtTime + ESCROW_PERIOD_HOURS * 60 * 60 * 1000;
          const timeRemainingMs = escrowEndTime - nowTime;

          return {
            orderItemId: item._id.toString(),
            orderCode: order?.orderCode,
            customerEmail: order?.customerUserId?.email,
            customerName: order?.customerUserId?.fullName,
            shopName: shop?.shopName,
            shopId: shop?._id?.toString(),
            productTitle: product?.title,
            inventorySku: inventory?.sku,
            itemStatus: item.itemStatus,
            holdAmount: item.holdAmount,
            holdAt: item.holdAt,
            hoursHeld: Math.floor((nowTime - holdAtTime) / (1000 * 60 * 60)),
            timeRemainingSeconds: timeRemainingMs > 0 ? Math.floor(timeRemainingMs / 1000) : 0,
            timeRemainingFormatted: timeRemainingMs > 0
              ? `${Math.floor(timeRemainingMs / (1000 * 60 * 60))}h ${Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60))}m`
              : "Ready",
            isReadyForDisbursement: new Date(item.holdAt) <= cutoffTime,
            hasOpenComplaint: !!hasComplaint,
            canDisburse: !hasComplaint && new Date(item.holdAt) <= cutoffTime,
          };
        })
      );

      const total = await OrderItem.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          items: itemsWithDetails,
          pagination: {
            total,
            limit: parseInt(limit as string, 10),
            skip: parseInt(skip as string, 10),
          },
          summary: {
            totalHolding: total,
            readyForDisbursement: itemsWithDetails.filter(i => i.isReadyForDisbursement).length,
            withComplaints: itemsWithDetails.filter(i => i.hasOpenComplaint).length,
          }
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get pending disbursements (Admin)
   * GET /api/admin/disbursement/pending
   */
  getPendingDisbursements = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit = 50, skip = 0 } = req.query;

      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - ESCROW_PERIOD_HOURS);

      // Find items that are ready for disbursement
      const pendingItems = await OrderItem.find({
        holdStatus: "Holding",
        holdAt: { $lte: cutoffTime },
      })
        .populate({
          path: "orderId",
          populate: {
            path: "customerUserId",
            select: "email fullName",
          },
        })
        .populate("shopId", "shopName ownerUserId")
        .populate("productId", "title")
        .sort({ holdAt: 1 })
        .limit(parseInt(limit as string, 10))
        .skip(parseInt(skip as string, 10));

      // Check for complaints on each item
      const itemsWithComplaintStatus = await Promise.all(
        pendingItems.map(async (item) => {
          const hasComplaint = await SupportTicket.exists({
            orderItemId: item._id,
            status: { $in: ["Open", "InReview", "NeedMoreInfo", "ModeratorAssigned"] },
          });

          const order = item.orderId as any;
          const shop = item.shopId as any;
          const product = item.productId as any;

          return {
            orderItemId: item._id.toString(),
            orderCode: order?.orderCode,
            customerEmail: order?.customerUserId?.email,
            customerName: order?.customerUserId?.fullName,
            shopName: shop?.shopName,
            productTitle: product?.title,
            holdAmount: item.holdAmount,
            holdAt: item.holdAt,
            hoursHeld: Math.floor(
              (new Date().getTime() - new Date(item.holdAt).getTime()) /
                (1000 * 60 * 60)
            ),
            hasOpenComplaint: !!hasComplaint,
            canDisburse: !hasComplaint,
          };
        })
      );

      const total = await OrderItem.countDocuments({
        holdStatus: "Holding",
        holdAt: { $lte: cutoffTime },
      });

      res.status(200).json({
        success: true,
        data: {
          items: itemsWithComplaintStatus,
          pagination: {
            total,
            limit: parseInt(limit as string, 10),
            skip: parseInt(skip as string, 10),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manual trigger disbursement for single item (Admin)
   * POST /api/admin/disbursement/:itemId
   */
  triggerDisbursement = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { itemId } = req.params;
      const itemIdStr = Array.isArray(itemId) ? itemId[0] : itemId;

      const result = await disbursementService.processOrderItemDisbursement(itemIdStr);

      res.status(200).json({
        success: result.success,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get disbursement statistics (Admin)
   * GET /api/admin/disbursement/stats
   */
  getDisbursementStats = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const now = new Date();
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - ESCROW_PERIOD_HOURS);

      // Aggregate statistics
      const [holdingStats, releasedStats, refundedStats] = await Promise.all([
        // Currently holding
        OrderItem.aggregate([
          { $match: { holdStatus: "Holding" } },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: "$holdAmount" },
            },
          },
        ]),

        // Released in last 30 days
        OrderItem.aggregate([
          {
            $match: {
              holdStatus: "Released",
              releaseAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: "$holdAmount" },
            },
          },
        ]),

        // Refunded in last 30 days
        OrderItem.aggregate([
          {
            $match: {
              holdStatus: "Refunded",
              releaseAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
            },
          },
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              totalAmount: { $sum: "$holdAmount" },
            },
          },
        ]),
      ]);

      // Ready for disbursement (past 72h, no complaint)
      const readyForDisbursement = await OrderItem.countDocuments({
        holdStatus: "Holding",
        holdAt: { $lte: cutoffTime },
      });

      res.status(200).json({
        success: true,
        data: {
          holding: {
            count: holdingStats[0]?.count || 0,
            totalAmount: holdingStats[0]?.totalAmount || 0,
          },
          releasedLast30Days: {
            count: releasedStats[0]?.count || 0,
            totalAmount: releasedStats[0]?.totalAmount || 0,
          },
          refundedLast30Days: {
            count: refundedStats[0]?.count || 0,
            totalAmount: refundedStats[0]?.totalAmount || 0,
          },
          readyForDisbursement,
          escrowPeriodHours: ESCROW_PERIOD_HOURS,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const disbursementController = new DisbursementController();
