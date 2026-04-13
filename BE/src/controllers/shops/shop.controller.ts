import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { ShopService } from "@/services/shops/shop.service";
import { createShopSchema, updateShopSchema } from "@/validators/shops/shop.schema";
import { AppError } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";
import { Wallet, OrderItem, Review, Product, InventoryItem } from "@/models";
import mongoose from "mongoose";

export class ShopController {
  private shopService: ShopService;

  constructor() {
    this.shopService = new ShopService();
  }

  createShop = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = createShopSchema.parse(req.body);

      const shop = await this.shopService.createShop(
        userId,
        validatedData.shopName,
        validatedData.description || undefined
      );

      res.status(201).json({
        success: true,
        message: MESSAGES.SUCCESS.SHOP_CREATED,
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyShop = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const shop = await this.shopService.getShopByOwnerId(userId);

      if (!shop) {
        throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
      }

      res.status(200).json({
        success: true,
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  };

  getShopById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const shop = await this.shopService.findById(shopId);

      if (!shop || shop.isDeleted) {
        throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
      }

      res.status(200).json({
        success: true,
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  };

  updateShop = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const validatedData = updateShopSchema.parse(req.body);

      // Verify ownership
      const shop = await this.shopService.getShopByOwnerId(userId);
      if (!shop || shop._id.toString() !== shopId) {
        throw new AppError(MESSAGES.ERROR.SHOP.ACCESS_DENIED, 403);
      }

      const updatedShop = await this.shopService.updateById(shopId, validatedData);

      if (!updatedShop) {
        throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
      }

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.SHOP_UPDATED,
        data: updatedShop,
      });
    } catch (error) {
      next(error);
    }
  };

  // Moderator endpoints
  getPendingShops = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shops = await this.shopService.getPendingShops();

      // Transform shops to ensure proper format for frontend
      // Handle both Mongoose documents and plain objects (from lean())
      const transformedShops = shops.map((shop: any) => {
        try {
          const ownerId = shop.ownerUserId
            ? (typeof shop.ownerUserId === "object" && shop.ownerUserId !== null
                ? shop.ownerUserId._id?.toString() || shop.ownerUserId.toString()
                : shop.ownerUserId.toString())
            : "";

          const approvedById = shop.approvedByUserId
            ? (typeof shop.approvedByUserId === "object" && shop.approvedByUserId !== null
                ? shop.approvedByUserId._id?.toString() || shop.approvedByUserId.toString()
                : shop.approvedByUserId.toString())
            : null;

          return {
            _id: shop._id?.toString() || shop._id,
            ownerUserId: ownerId,
            shopName: shop.shopName || "",
            description: shop.description || null,
            status: shop.status || "Pending",
            approvedByUserId: approvedById,
            approvedAt: shop.approvedAt
              ? (shop.approvedAt instanceof Date
                  ? shop.approvedAt.toISOString()
                  : new Date(shop.approvedAt).toISOString())
              : null,
            moderatorNote: shop.moderatorNote || null,
            ratingAvg: shop.ratingAvg || 0,
            totalSales: shop.totalSales || 0,
            createdAt: shop.createdAt instanceof Date
              ? shop.createdAt.toISOString()
              : new Date(shop.createdAt).toISOString(),
            updatedAt: shop.updatedAt instanceof Date
              ? shop.updatedAt.toISOString()
              : new Date(shop.updatedAt).toISOString(),
          };
        } catch {
          // Return a safe default object
          return {
            _id: shop._id?.toString() || "",
            ownerUserId: "",
            shopName: shop.shopName || "Unknown",
            description: null,
            status: shop.status || "Pending",
            approvedByUserId: null,
            approvedAt: null,
            moderatorNote: null,
            ratingAvg: 0,
            totalSales: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      });

      res.status(200).json({
        success: true,
        data: transformedShops,
      });
    } catch (error) {
      next(error);
    }
  };

  approveShop = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moderatorUserId = req.user!.id;
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const { moderatorNote } = req.body;

      const shop = await this.shopService.approveShop(
        shopId,
        moderatorUserId,
        moderatorNote
      );

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.SHOP_APPROVED,
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  };

  rejectShop = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const moderatorUserId = req.user!.id;
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const { moderatorNote } = req.body;

      const shop = await this.shopService.rejectShop(
        shopId,
        moderatorUserId,
        moderatorNote
      );

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.SHOP_REJECTED,
        data: shop,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get seller dashboard stats
   * GET /api/shops/me/stats
   */
  getMyShopStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const shop = await this.shopService.getShopByOwnerId(userId);

      if (!shop) {
        throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
      }

      const shopId = shop._id;

      // Get wallet balance (seller's wallet)
      const wallet = await Wallet.findOne({
        userId: new mongoose.Types.ObjectId(userId),
      });

      // Get order stats for this shop
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Count total orders and weekly orders from OrderItem
      const [totalOrderItems, weeklyOrderItems] = await Promise.all([
        OrderItem.countDocuments({
          shopId: shopId,
        }),
        OrderItem.countDocuments({
          shopId: shopId,
          createdAt: { $gte: weekAgo },
        }),
      ]);

      // Calculate escrow (sum of holdAmount where holdStatus is "Holding")
      const escrowResult = await OrderItem.aggregate([
        {
          $match: {
            shopId: new mongoose.Types.ObjectId(shopId.toString()),
            holdStatus: "Holding",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$holdAmount" },
          },
        },
      ]);
      const escrowAmount = escrowResult[0]?.total || 0;

      // Calculate total paid out (sum of subtotal where holdStatus is "Released")
      const paidOutResult = await OrderItem.aggregate([
        {
          $match: {
            shopId: new mongoose.Types.ObjectId(shopId.toString()),
            holdStatus: "Released",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$subtotal" },
          },
        },
      ]);
      const paidOutAmount = paidOutResult[0]?.total || 0;

      // Get reviews stats for shop
      const reviewStats = await Review.aggregate([
        {
          $match: {
            shopId: new mongoose.Types.ObjectId(shopId.toString()),
            status: "Visible", // Review không có isDeleted, dùng status thay thế
          },
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      // Get product counts
      const [totalProducts, approvedProducts, pendingProducts] = await Promise.all([
        Product.countDocuments({ shopId: shopId, isDeleted: false }),
        Product.countDocuments({ shopId: shopId, isDeleted: false, status: "Approved" }),
        Product.countDocuments({ shopId: shopId, isDeleted: false, status: "Pending" }),
      ]);

      // Get inventory stats
      const inventoryStats = await InventoryItem.aggregate([
        {
          $match: {
            shopId: new mongoose.Types.ObjectId(shopId.toString()),
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const inventoryCounts = {
        total: 0,
        available: 0,
        reserved: 0,
        delivered: 0,
      };
      inventoryStats.forEach((stat) => {
        inventoryCounts.total += stat.count;
        if (stat._id === "Available") inventoryCounts.available = stat.count;
        if (stat._id === "Reserved") inventoryCounts.reserved = stat.count;
        if (stat._id === "Delivered") inventoryCounts.delivered = stat.count;
      });

      res.status(200).json({
        success: true,
        data: {
          // Wallet/Revenue stats
          availableBalance: wallet?.balance || 0,
          holdBalance: wallet?.holdBalance || 0,
          escrowAmount: escrowAmount,
          paidOutAmount: paidOutAmount,

          // Order stats
          totalOrders: totalOrderItems,
          weeklyOrders: weeklyOrderItems,

          // Rating stats
          avgRating: reviewStats[0]?.avgRating || shop.ratingAvg || 0,
          totalReviews: reviewStats[0]?.totalReviews || 0,

          // Product stats
          totalProducts,
          approvedProducts,
          pendingProducts,

          // Inventory stats
          inventory: inventoryCounts,

          // Shop info
          totalSales: shop.totalSales || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
