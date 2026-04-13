import { BaseService } from "@/services/base.service";
import { Review, IReview, Shop, OrderItem, Product } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { emitReviewEvent } from "@/config/socket";
import mongoose from "mongoose";

export class ReviewService extends BaseService<IReview> {
  constructor() {
    super(Review);
  }

  /**
   * Create a new review for an order item
   */
  async createReview(
    userId: string,
    orderItemId: string,
    productId: string,
    shopId: string,
    rating: number,
    comment: string,
    images?: string[]
  ): Promise<IReview> {
    // Check if user already reviewed this order item
    const existingReview = await Review.findOne({
      userId,
      orderItemId,
    });
    if (existingReview) {
      throw new AppError("You have already reviewed this order item", 400);
    }

    // Verify order item exists and is completed
    const orderItem = await OrderItem.findById(orderItemId).populate("orderId");
    if (!orderItem) {
      throw new AppError("Order item not found", 404);
    }

    // Verify order item status is Completed
    if (orderItem.itemStatus !== "Completed") {
      throw new AppError("You can only review completed orders", 400);
    }

    // Validate images count
    if (images && images.length > 5) {
      throw new AppError("Maximum 5 images allowed", 400);
    }

    // Create review
    const review = await Review.create({
      orderItemId,
      productId,
      userId,
      shopId,
      rating,
      comment,
      images: images || [],
      status: "Visible",
    });

    // Get stats và update cùng lúc (chỉ gọi 1 lần)
    const [productStats, shopStats] = await Promise.all([
      this.getProductRatingStats(productId),
      this.getShopRatingStats(shopId),
    ]);

    // Update product, shop ratings và response rate (không cần gọi stats lại)
    await Promise.all([
      Product.findByIdAndUpdate(productId, {
        ratingAvg: productStats.averageRating,
        reviewCount: productStats.totalReviews,
      }),
      Shop.findByIdAndUpdate(shopId, {
        ratingAvg: shopStats.averageRating,
        reviewCount: shopStats.totalReviews,
      }),
      this.updateShopResponseRate(shopId),
    ]);

    // Emit socket event (non-blocking)
    setImmediate(() => {
      emitReviewEvent("review:created", {
        reviewId: review._id.toString(),
        productId,
        shopId,
        userId,
        rating,
        comment,
        images,
        productRatingAvg: productStats.averageRating,
        productReviewCount: productStats.totalReviews,
        shopRatingAvg: shopStats.averageRating,
      });
    });

    return review;
  }

  /**
   * Get reviews by product ID with pagination
   */
  async getReviewsByProduct(
    productId: string,
    options: {
      page?: number;
      limit?: number;
      rating?: number;
      status?: "Visible" | "Hidden";
    } = {}
  ): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { productId };

    if (options.status) {
      filter.status = options.status;
    } else {
      filter.status = "Visible";
    }

    if (options.rating) {
      filter.rating = options.rating;
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("userId", "fullName avatarUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get reviews by shop ID with pagination
   */
  async getReviewsByShop(
    shopId: string,
    options: {
      page?: number;
      limit?: number;
      status?: "Visible" | "Hidden";
    } = {}
  ): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = { shopId };
    if (options.status) {
      filter.status = options.status;
    } else {
      filter.status = "Visible";
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("userId", "fullName avatarUrl")
        .populate("productId", "title thumbnailUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get reviews by user ID
   */
  async getReviewsByUser(userId: string): Promise<IReview[]> {
    return Review.find({ userId })
      .populate("shopId", "shopName")
      .populate("productId", "title thumbnailUrl")
      .sort({ createdAt: -1 });
  }

  /**
   * Get review by ID
   */
  async getReviewById(reviewId: string): Promise<IReview | null> {
    return Review.findById(reviewId)
      .populate("userId", "fullName avatarUrl")
      .populate("shopId", "shopName")
      .populate("productId", "title thumbnailUrl");
  }

  /**
   * Update review (only by owner)
   */
  async updateReview(
    reviewId: string,
    userId: string,
    data: { rating?: number; comment?: string; images?: string[] }
  ): Promise<IReview | null> {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new AppError("Review not found or access denied", 404);
    }

    // Validate images count
    if (data.images && data.images.length > 5) {
      throw new AppError("Maximum 5 images allowed", 400);
    }

    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { ...data },
      { new: true }
    );

    const productId = review.productId.toString();
    const shopId = review.shopId.toString();

    // Update ratings if rating changed
    if (data.rating) {
      await Promise.all([
        this.updateProductRating(productId),
        this.updateShopRating(shopId),
      ]);
    }

    // Get updated stats for socket event
    const [productStats, shopStats] = await Promise.all([
      this.getProductRatingStats(productId),
      this.getShopRatingStats(shopId),
    ]);

    // Emit socket event
    emitReviewEvent("review:updated", {
      reviewId,
      productId,
      shopId,
      userId,
      rating: updatedReview?.rating,
      comment: updatedReview?.comment,
      images: updatedReview?.images,
      productRatingAvg: productStats.averageRating,
      productReviewCount: productStats.totalReviews,
      shopRatingAvg: shopStats.averageRating,
    });

    return updatedReview;
  }

  /**
   * Delete review (only by owner)
   */
  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    const review = await Review.findOne({ _id: reviewId, userId });
    if (!review) {
      throw new AppError("Review not found or access denied", 404);
    }

    const productId = review.productId.toString();
    const shopId = review.shopId.toString();

    await Review.findByIdAndDelete(reviewId);

    // Update product and shop ratings, and response rate
    await Promise.all([
      this.updateProductRating(productId),
      this.updateShopRating(shopId),
      this.updateShopResponseRate(shopId),
    ]);

    // Get updated stats for socket event
    const [productStats, shopStats] = await Promise.all([
      this.getProductRatingStats(productId),
      this.getShopRatingStats(shopId),
    ]);

    // Emit socket event
    emitReviewEvent("review:deleted", {
      reviewId,
      productId,
      shopId,
      productRatingAvg: productStats.averageRating,
      productReviewCount: productStats.totalReviews,
      shopRatingAvg: shopStats.averageRating,
    });

    return true;
  }

  /**
   * Hide review (moderator action)
   */
  async hideReview(reviewId: string): Promise<IReview | null> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: "Hidden" },
      { new: true }
    );

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    const productId = review.productId.toString();
    const shopId = review.shopId.toString();

    // Update ratings and response rate (excluding hidden review)
    await Promise.all([
      this.updateProductRating(productId),
      this.updateShopRating(shopId),
      this.updateShopResponseRate(shopId),
    ]);

    // Get updated stats for socket event
    const [productStats, shopStats] = await Promise.all([
      this.getProductRatingStats(productId),
      this.getShopRatingStats(shopId),
    ]);

    // Emit socket event
    emitReviewEvent("review:updated", {
      reviewId,
      productId,
      shopId,
      productRatingAvg: productStats.averageRating,
      productReviewCount: productStats.totalReviews,
      shopRatingAvg: shopStats.averageRating,
    });

    return review;
  }

  /**
   * Unhide review (moderator action)
   */
  async unhideReview(reviewId: string): Promise<IReview | null> {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status: "Visible" },
      { new: true }
    );

    if (!review) {
      throw new AppError("Review not found", 404);
    }

    const productId = review.productId.toString();
    const shopId = review.shopId.toString();

    // Update ratings and response rate
    await Promise.all([
      this.updateProductRating(productId),
      this.updateShopRating(shopId),
      this.updateShopResponseRate(shopId),
    ]);

    // Get updated stats for socket event
    const [productStats, shopStats] = await Promise.all([
      this.getProductRatingStats(productId),
      this.getShopRatingStats(shopId),
    ]);

    // Emit socket event
    emitReviewEvent("review:updated", {
      reviewId,
      productId,
      shopId,
      productRatingAvg: productStats.averageRating,
      productReviewCount: productStats.totalReviews,
      shopRatingAvg: shopStats.averageRating,
    });

    return review;
  }

  /**
   * Get all reviews for moderation (moderator only)
   */
  async getAllReviewsForModeration(
    options: {
      page?: number;
      limit?: number;
      status?: "Visible" | "Hidden";
    } = {}
  ): Promise<{ reviews: IReview[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (options.status) {
      filter.status = options.status;
    }

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate("userId", "fullName email avatarUrl")
        .populate("shopId", "shopName")
        .populate("productId", "title thumbnailUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    return {
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get product rating statistics (optimized with aggregation)
   */
  async getProductRatingStats(productId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const result = await Review.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId), status: "Visible" } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]);

    const stats = result[0];
    return {
      averageRating: stats ? Math.round(stats.avgRating * 10) / 10 : 0,
      totalReviews: stats?.totalReviews || 0,
      ratingDistribution: {
        1: stats?.rating1 || 0,
        2: stats?.rating2 || 0,
        3: stats?.rating3 || 0,
        4: stats?.rating4 || 0,
        5: stats?.rating5 || 0,
      },
    };
  }

  /**
   * Get shop rating statistics (optimized with aggregation)
   */
  async getShopRatingStats(shopId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  }> {
    const result = await Review.aggregate([
      { $match: { shopId: new mongoose.Types.ObjectId(shopId), status: "Visible" } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgRating: { $avg: "$rating" },
          rating1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]);

    const stats = result[0];
    return {
      averageRating: stats ? Math.round(stats.avgRating * 10) / 10 : 0,
      totalReviews: stats?.totalReviews || 0,
      ratingDistribution: {
        1: stats?.rating1 || 0,
        2: stats?.rating2 || 0,
        3: stats?.rating3 || 0,
        4: stats?.rating4 || 0,
        5: stats?.rating5 || 0,
      },
    };
  }

  /**
   * Update product's average rating
   */
  private async updateProductRating(productId: string): Promise<void> {
    const stats = await this.getProductRatingStats(productId);
    await Product.findByIdAndUpdate(productId, {
      ratingAvg: stats.averageRating,
      reviewCount: stats.totalReviews,
    });
  }

  /**
   * Update shop's average rating and review count
   */
  private async updateShopRating(shopId: string): Promise<void> {
    const stats = await this.getShopRatingStats(shopId);
    await Shop.findByIdAndUpdate(shopId, {
      ratingAvg: stats.averageRating,
      reviewCount: stats.totalReviews,
    });
  }

  /**
   * Update shop's response rate (percentage of reviews that have seller reply)
   */
  async updateShopResponseRate(shopId: string): Promise<void> {
    const [totalReviews, repliedReviews] = await Promise.all([
      Review.countDocuments({ shopId, status: "Visible" }),
      Review.countDocuments({
        shopId,
        status: "Visible",
        sellerReply: { $ne: null, $exists: true }
      }),
    ]);

    const responseRate = totalReviews > 0
      ? Math.round((repliedReviews / totalReviews) * 100)
      : 0;

    await Shop.findByIdAndUpdate(shopId, { responseRate });
  }

  /**
   * Get count of unreplied reviews for a shop
   */
  async getUnrepliedReviewsCount(shopId: string): Promise<number> {
    return Review.countDocuments({
      shopId,
      status: "Visible",
      $or: [
        { sellerReply: null },
        { sellerReply: { $exists: false } }
      ]
    });
  }

  /**
   * Reply to a review (seller only, once per review)
   */
  async replyToReview(
    reviewId: string,
    userId: string,
    reply: string
  ): Promise<IReview | null> {
    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      throw new AppError("Review not found", 404);
    }

    // Check if review already has a reply
    if (review.sellerReply) {
      throw new AppError("This review already has a reply", 400);
    }

    // Verify the user is the shop owner
    const shop = await Shop.findById(review.shopId);
    if (!shop) {
      throw new AppError("Shop not found", 404);
    }

    if (shop.ownerUserId.toString() !== userId) {
      throw new AppError("You are not authorized to reply to this review", 403);
    }

    // Add the reply
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        sellerReply: reply,
        sellerReplyAt: new Date(),
      },
      { new: true }
    ).populate("userId", "fullName avatarUrl")
     .populate("productId", "title thumbnailUrl");

    // Update shop response rate
    await this.updateShopResponseRate(review.shopId.toString());

    // Emit socket event
    emitReviewEvent("review:updated", {
      reviewId,
      productId: review.productId.toString(),
      shopId: review.shopId.toString(),
      sellerReply: reply,
      sellerReplyAt: new Date(),
    });

    return updatedReview;
  }
}
