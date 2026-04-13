import { BaseService } from "@/services/base.service";
import { Product, IProduct, Shop, PlatformCatalog, OrderItem, Review } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { PlanType } from "@/types";
import { MESSAGES } from "@/constants/messages";
import mongoose from "mongoose";

export interface CreateProductData {
  shopId: string;
  platformId: string;
  title: string;
  description: string;
  warrantyPolicy: string;
  howToUse: string;
  thumbnailUrl?: string | null;
  planType: PlanType;
  durationDays: number;
  price: number;
}

export class ProductService extends BaseService<IProduct> {
  constructor() {
    super(Product);
  }

  async createProduct(data: CreateProductData, sellerUserId: string): Promise<IProduct> {
    // Verify shop exists and belongs to user
    const shop = await Shop.findOne({
      _id: data.shopId,
      ownerUserId: sellerUserId,
      isDeleted: false,
    });
    if (!shop) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.SHOP_NOT_FOUND_OR_ACCESS_DENIED, 404);
    }

    if (shop.status !== "Active") {
      throw new AppError("Shop is not approved yet", 403);
    }

    // Verify platform exists
    const platform = await PlatformCatalog.findById(data.platformId);
    if (!platform || platform.status !== "Active") {
      throw new AppError(MESSAGES.ERROR.PRODUCT.PLATFORM_NOT_FOUND, 404);
    }

    // Create product
    const product = await Product.create({
      ...data,
      status: "Approved",
      approvedByUserId: null,
      approvedAt: null,
      rejectionReason: null,
    });

    return product;
  }

  async approveProduct(
    productId: string,
    moderatorUserId: string
  ): Promise<IProduct | null> {
    const product = await this.model.findByIdAndUpdate(
      productId,
      {
        status: "Approved",
        approvedByUserId: moderatorUserId,
        approvedAt: new Date(),
      },
      { new: true }
    );

    if (!product) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.NOT_FOUND, 404);
    }

    return product;
  }

  async rejectProduct(
    productId: string,
    moderatorUserId: string,
    reason: string
  ): Promise<IProduct | null> {
    const product = await this.model.findByIdAndUpdate(
      productId,
      {
        status: "Rejected",
        approvedByUserId: moderatorUserId,
        approvedAt: new Date(),
        rejectionReason: reason,
      },
      { new: true }
    );

    if (!product) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.NOT_FOUND, 404);
    }

    return product;
  }

  async getProductsByShop(shopId: string): Promise<IProduct[]> {
    return this.model
      .find({ shopId, isDeleted: false })
      .populate("platformId")
      .sort({ createdAt: -1 });
  }

  /**
   * Get product by ID with shop and platform populated
   */
  async getProductByIdWithPopulate(productId: string): Promise<IProduct | null> {
    return this.model
      .findById(productId)
      .populate("platformId")
      .populate("shopId");
  }

  async getProductsByPlatform(platformId: string): Promise<IProduct[]> {
    return this.model
      .find({
        platformId,
        status: "Approved",
        isDeleted: false,
      })
      .populate("shopId")
      .sort({ createdAt: -1 });
  }

  // Public products for listing (KHÔNG cần quy trình duyệt thủ công)
  // Chỉ ẩn sản phẩm đã xóa (`isDeleted: true`)
  async getApprovedProducts(filter: {
    platformId?: string;
    planType?: PlanType;
    minPrice?: number;
    maxPrice?: number;
    shopId?: string;
  } = {}): Promise<IProduct[]> {
    const query: any = {
      isDeleted: false,
    };

    if (filter.platformId) {
      query.platformId = filter.platformId;
    }
    if (filter.shopId) {
      query.shopId = filter.shopId;
    }
    if (filter.planType) {
      query.planType = filter.planType;
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) {
        query.price.$gte = filter.minPrice;
      }
      if (filter.maxPrice !== undefined) {
        query.price.$lte = filter.maxPrice;
      }
    }

    return this.model.find(query).populate("platformId").populate("shopId");
  }

  /**
   * Get rating stats for multiple products
   */
  async getProductsRatingStats(productIds: string[]): Promise<Record<string, { avgRating: number; reviewCount: number }>> {
    if (productIds.length === 0) {
      return {};
    }

    try {
      const objectIds = productIds
        .map((id) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is mongoose.Types.ObjectId => id !== null);

      if (objectIds.length === 0) {
        return {};
      }

      // Get reviews through orderItems to get productId
      const ratingData = await Review.aggregate([
        {
          $match: {
            status: "Visible",
          },
        },
        {
          $lookup: {
            from: "orderitems",
            localField: "orderItemId",
            foreignField: "_id",
            as: "orderItem",
          },
        },
        {
          $unwind: "$orderItem",
        },
        {
          $match: {
            "orderItem.productId": { $in: objectIds },
          },
        },
        {
          $group: {
            _id: "$orderItem.productId",
            avgRating: { $avg: "$rating" },
            reviewCount: { $sum: 1 },
          },
        },
      ]);

      const ratingMap: Record<string, { avgRating: number; reviewCount: number }> = {};
      ratingData.forEach((item) => {
        ratingMap[item._id.toString()] = {
          avgRating: Math.round(item.avgRating * 10) / 10, // Round to 1 decimal
          reviewCount: item.reviewCount,
        };
      });

      // Fill in zeros for products without reviews
      productIds.forEach((id) => {
        if (!ratingMap[id]) {
          ratingMap[id] = { avgRating: 0, reviewCount: 0 };
        }
      });

      return ratingMap;
    } catch {
      const ratingMap: Record<string, { avgRating: number; reviewCount: number }> = {};
      productIds.forEach((id) => {
        ratingMap[id] = { avgRating: 0, reviewCount: 0 };
      });
      return ratingMap;
    }
  }

  /**
   * Get sales count for multiple products
   */
  async getProductsSalesCount(productIds: string[]): Promise<Record<string, number>> {
    if (productIds.length === 0) {
      return {};
    }

    try {
      const objectIds = productIds
        .map((id) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is mongoose.Types.ObjectId => id !== null);

      if (objectIds.length === 0) {
        return {};
      }

      const salesData = await OrderItem.aggregate([
        {
          $match: {
            productId: { $in: objectIds },
            itemStatus: { $in: ["Delivered", "Completed"] },
          },
        },
        {
          $group: {
            _id: "$productId",
            salesCount: { $sum: "$quantity" },
          },
        },
      ]);

      const salesMap: Record<string, number> = {};
      salesData.forEach((item) => {
        salesMap[item._id.toString()] = item.salesCount;
      });

      productIds.forEach((id) => {
        if (!salesMap[id]) {
          salesMap[id] = 0;
        }
      });

      return salesMap;
    } catch {
      const salesMap: Record<string, number> = {};
      productIds.forEach((id) => {
        salesMap[id] = 0;
      });
      return salesMap;
    }
  }

  async updateProduct(
    productId: string,
    sellerUserId: string,
    data: Partial<CreateProductData>
  ): Promise<IProduct | null> {
    // Find the product
    const product = await this.model.findById(productId);
    if (!product || product.isDeleted) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.NOT_FOUND, 404);
    }

    // Verify shop ownership
    const shop = await Shop.findOne({
      _id: product.shopId,
      ownerUserId: sellerUserId,
      isDeleted: false,
    });
    if (!shop) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.SHOP_NOT_FOUND_OR_ACCESS_DENIED, 403);
    }

    if (shop.status !== "Active") {
      throw new AppError("Shop is not approved yet", 403);
    }

    // If platform is being changed, verify new platform exists
    if (data.platformId && data.platformId !== product.platformId.toString()) {
      const platform = await PlatformCatalog.findById(data.platformId);
      if (!platform || platform.status !== "Active") {
        throw new AppError(MESSAGES.ERROR.PRODUCT.PLATFORM_NOT_FOUND, 404);
      }
    }

    // Update product
    const updateData: any = { ...data };
    if (data.title || data.description || data.price || data.platformId) {
      updateData.status = "Approved";
      updateData.approvedByUserId = null;
      updateData.approvedAt = null;
      updateData.rejectionReason = null;
    }

    const updatedProduct = await this.model.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    ).populate("platformId");

    return updatedProduct;
  }

  async deleteProduct(
    productId: string,
    sellerUserId: string
  ): Promise<boolean> {
    // Find the product
    const product = await this.model.findById(productId);
    if (!product || product.isDeleted) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.NOT_FOUND, 404);
    }

    // Verify shop ownership
    const shop = await Shop.findOne({
      _id: product.shopId,
      ownerUserId: sellerUserId,
      isDeleted: false,
    });
    if (!shop) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.SHOP_NOT_FOUND_OR_ACCESS_DENIED, 403);
    }

    // Soft delete the product
    await this.model.findByIdAndUpdate(productId, { isDeleted: true });

    return true;
  }

  async getPendingProducts(): Promise<IProduct[]> {
    return this.model
      .find({ status: "Pending", isDeleted: false })
      .populate("platformId")
      .populate("shopId")
      .sort({ createdAt: -1 });
  }

  async getProductByIdForSeller(
    productId: string,
    sellerUserId: string
  ): Promise<IProduct | null> {
    const product = await this.model
      .findById(productId)
      .populate("platformId")
      .populate("shopId");

    if (!product || product.isDeleted) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.NOT_FOUND, 404);
    }

    // Verify shop ownership
    const shop = await Shop.findOne({
      _id: product.shopId,
      ownerUserId: sellerUserId,
      isDeleted: false,
    });
    if (!shop) {
      throw new AppError(MESSAGES.ERROR.PRODUCT.SHOP_NOT_FOUND_OR_ACCESS_DENIED, 403);
    }

    return product;
  }

  /**
   * Get featured products based on rating and sales
   * Featured = products with high average rating and good sales volume
   */
  async getFeaturedProducts(limit: number = 4): Promise<IProduct[]> {
    try {
      // Get sales count per product
      const salesByProduct = await OrderItem.aggregate([
      {
        $match: {
          itemStatus: { $in: ["Delivered", "Completed"] },
        },
      },
      {
        $group: {
          _id: "$productId",
          salesCount: { $sum: "$quantity" },
        },
      },
    ]);

    // Get reviews and group by productId through orderItemId
    const reviewsByProduct = await Review.aggregate([
      {
        $lookup: {
          from: "orderitems",
          localField: "orderItemId",
          foreignField: "_id",
          as: "orderItem",
        },
      },
      {
        $unwind: "$orderItem",
      },
      {
        $group: {
          _id: "$orderItem.productId",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    // Combine sales and reviews data
    const productStatsMap = new Map();
    
    salesByProduct.forEach((item) => {
      productStatsMap.set(item._id.toString(), {
        productId: item._id,
        salesCount: item.salesCount,
        avgRating: 0,
        reviewCount: 0,
      });
    });

    reviewsByProduct.forEach((item) => {
      const existing = productStatsMap.get(item._id.toString());
      if (existing) {
        existing.avgRating = item.avgRating;
        existing.reviewCount = item.reviewCount;
      } else {
        productStatsMap.set(item._id.toString(), {
          productId: item._id,
          salesCount: 0,
          avgRating: item.avgRating,
          reviewCount: item.reviewCount,
        });
      }
    });

    // Calculate score and sort
    const productsWithStats = Array.from(productStatsMap.values())
      .map((stat) => ({
        ...stat,
        score: stat.avgRating * 0.6 + Math.min(stat.salesCount / 10, 5) * 0.4,
      }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.salesCount - a.salesCount;
      })
      .slice(0, limit);

    const productIds = productsWithStats.map((p) => p.productId);

    // Get products
    let products = await this.model
      .find({
        _id: { $in: productIds },
        isDeleted: false,
        status: "Approved",
      })
      .populate("platformId")
      .populate("shopId")
      .lean();

    // Sort products to match the stats order
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    products = productIds
      .map((id) => productMap.get(id.toString()))
      .filter((p) => p !== undefined) as any[];

    // If we don't have enough products, fill with recent approved products
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const additionalProducts = await this.model
        .find({
          _id: { $nin: existingIds },
          isDeleted: false,
          status: "Approved",
        })
        .populate("platformId")
        .populate("shopId")
        .sort({ createdAt: -1 })
        .limit(limit - products.length)
        .lean();

      products.push(...additionalProducts);
    }

    return products as IProduct[];
    } catch {
      // Return empty array on error, but try to get recent products as fallback
      try {
        const fallbackProducts = await this.model
          .find({
            isDeleted: false,
            status: "Approved",
          })
          .populate("platformId")
          .populate("shopId")
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean();
        return fallbackProducts as IProduct[];
      } catch {
        return [];
      }
    }
  }

  /**
   * Get top products based on sales count and ratings
   * Top = products with highest sales and good ratings
   */
  async getTopProducts(limit: number = 5): Promise<IProduct[]> {
    // Get sales count per product
    const salesByProduct = await OrderItem.aggregate([
      {
        $match: {
          itemStatus: { $in: ["Delivered", "Completed"] },
        },
      },
      {
        $group: {
          _id: "$productId",
          salesCount: { $sum: "$quantity" },
        },
      },
    ]);

    // Get reviews and group by productId through orderItemId
    const reviewsByProduct = await Review.aggregate([
      {
        $lookup: {
          from: "orderitems",
          localField: "orderItemId",
          foreignField: "_id",
          as: "orderItem",
        },
      },
      {
        $unwind: "$orderItem",
      },
      {
        $group: {
          _id: "$orderItem.productId",
          avgRating: { $avg: "$rating" },
        },
      },
    ]);

    // Combine sales and reviews data
    const productStatsMap = new Map();
    
    salesByProduct.forEach((item) => {
      productStatsMap.set(item._id.toString(), {
        productId: item._id,
        salesCount: item.salesCount,
        avgRating: 0,
        reviewCount: 0,
      });
    });

    reviewsByProduct.forEach((item) => {
      const existing = productStatsMap.get(item._id.toString());
      if (existing) {
        existing.avgRating = item.avgRating;
        existing.reviewCount = item.reviewCount;
      } else {
        productStatsMap.set(item._id.toString(), {
          productId: item._id,
          salesCount: 0,
          avgRating: item.avgRating,
          reviewCount: item.reviewCount,
        });
      }
    });

    // Sort by sales count first, then by rating
    const topProductsStats = Array.from(productStatsMap.values())
      .sort((a, b) => {
        if (b.salesCount !== a.salesCount) return b.salesCount - a.salesCount;
        return (b.avgRating || 0) - (a.avgRating || 0);
      })
      .slice(0, limit);

    const productIds = topProductsStats.map((p) => p.productId);

    // Get products
    let products = await this.model
      .find({
        _id: { $in: productIds },
        isDeleted: false,
        status: "Approved",
      })
      .populate("platformId")
      .populate("shopId")
      .lean();

    // Sort products to match the stats order and inject stats
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));
    const statsMap = new Map(topProductsStats.map((s) => [s.productId.toString(), s]));
    
    products = productIds
      .map((id) => {
        const product = productMap.get(id.toString());
        if (!product) return undefined;
        const stats = statsMap.get(id.toString());
        return {
          ...product,
          salesCount: stats?.salesCount || 0,
          avgRating: stats?.avgRating || 0,
          reviewCount: stats?.reviewCount || 0
        };
      })
      .filter((p) => p !== undefined) as any[];

    // If we don't have enough products, fill with recent approved products
    if (products.length < limit) {
      const existingIds = products.map((p) => p._id);
      const additionalProducts = await this.model
        .find({
          _id: { $nin: existingIds },
          isDeleted: false,
          status: "Approved",
        })
        .populate("platformId")
        .populate("shopId")
        .sort({ createdAt: -1 })
        .limit(limit - products.length)
        .lean();

      // Add stats (0) for additional products
      const additionalWithStats = additionalProducts.map((p: any) => ({
        ...p,
        salesCount: 0,
        avgRating: 0,
        reviewCount: 0,
      }));

      products.push(...additionalWithStats);
    }

    return products as IProduct[];
  }
}
