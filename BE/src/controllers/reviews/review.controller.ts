import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { ReviewService } from "@/services/reviews/review.service";
import { AppError } from "@/middleware/errorHandler";
import { z } from "zod";

// Validation schemas
const createReviewSchema = z.object({
  orderItemId: z.string().min(1, "Order item ID is required"),
  productId: z.string().min(1, "Product ID is required"),
  shopId: z.string().min(1, "Shop ID is required"),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Comment is required").max(1000),
  images: z.array(z.string().url()).max(5, "Maximum 5 images allowed").optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().min(1).max(1000).optional(),
  images: z.array(z.string().url()).max(5, "Maximum 5 images allowed").optional(),
});

const sellerReplySchema = z.object({
  reply: z.string().min(1, "Reply is required").max(1000, "Reply must be at most 1000 characters"),
});

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  /**
   * Create a new review
   * POST /reviews
   */
  createReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = createReviewSchema.parse(req.body);

      const review = await this.reviewService.createReview(
        userId,
        validatedData.orderItemId,
        validatedData.productId,
        validatedData.shopId,
        validatedData.rating,
        validatedData.comment,
        validatedData.images
      );

      res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get reviews by product ID
   * GET /reviews/product/:productId
   */
  getReviewsByProduct = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const rating = req.query.rating ? parseInt(req.query.rating as string) : undefined;

      const result = await this.reviewService.getReviewsByProduct(productId, {
        page,
        limit,
        rating,
        status: "Visible",
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product rating statistics
   * GET /reviews/product/:productId/stats
   */
  getProductRatingStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const productId = Array.isArray(req.params.productId)
        ? req.params.productId[0]
        : req.params.productId;
      const stats = await this.reviewService.getProductRatingStats(productId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get reviews by shop ID
   * GET /reviews/shop/:shopId
   */
  getReviewsByShop = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.reviewService.getReviewsByShop(shopId, {
        page,
        limit,
        status: "Visible",
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get my reviews (for logged in user)
   * GET /reviews/me
   */
  getMyReviews = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const reviews = await this.reviewService.getReviewsByUser(userId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get review by ID
   * GET /reviews/:reviewId
   */
  getReviewById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      const review = await this.reviewService.getReviewById(reviewId);

      if (!review) {
        throw new AppError("Review not found", 404);
      }

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update my review
   * PUT /reviews/:reviewId
   */
  updateReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      const validatedData = updateReviewSchema.parse(req.body);

      const review = await this.reviewService.updateReview(
        reviewId,
        userId,
        validatedData
      );

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete my review
   * DELETE /reviews/:reviewId
   */
  deleteReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;

      await this.reviewService.deleteReview(reviewId, userId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Hide review (moderator only)
   * PATCH /reviews/:reviewId/hide
   */
  hideReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      const review = await this.reviewService.hideReview(reviewId);

      res.status(200).json({
        success: true,
        message: "Review hidden successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unhide review (moderator only)
   * PATCH /reviews/:reviewId/unhide
   */
  unhideReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      const review = await this.reviewService.unhideReview(reviewId);

      res.status(200).json({
        success: true,
        message: "Review unhidden successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all reviews for moderation (moderator only)
   * GET /reviews/moderation/all
   */
  getAllReviewsForModeration = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as "Visible" | "Hidden" | undefined;

      const result = await this.reviewService.getAllReviewsForModeration({
        page,
        limit,
        status,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get shop rating statistics
   * GET /reviews/shop/:shopId/stats
   */
  getShopRatingStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const stats = await this.reviewService.getShopRatingStats(shopId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get unreplied reviews count for seller's shop
   * GET /reviews/shop/:shopId/unreplied-count
   */
  getUnrepliedReviewsCount = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const shopId = Array.isArray(req.params.shopId) ? req.params.shopId[0] : req.params.shopId;
      const count = await this.reviewService.getUnrepliedReviewsCount(shopId);

      res.status(200).json({
        success: true,
        data: { unrepliedCount: count },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reply to a review (seller only, once per review)
   * POST /reviews/:reviewId/reply
   */
  replyToReview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const reviewId = Array.isArray(req.params.reviewId) ? req.params.reviewId[0] : req.params.reviewId;
      const validatedData = sellerReplySchema.parse(req.body);

      const review = await this.reviewService.replyToReview(
        reviewId,
        userId,
        validatedData.reply
      );

      res.status(200).json({
        success: true,
        message: "Reply added successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };
}
