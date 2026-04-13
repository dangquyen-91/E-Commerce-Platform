import { Router } from "express";
import { ReviewController } from "@/controllers/reviews/review.controller";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();
const reviewController = new ReviewController();

// Public routes (Guest can access)
// Product reviews
router.get("/product/:productId", wrapRequestHandler(reviewController.getReviewsByProduct));
router.get("/product/:productId/stats", wrapRequestHandler(reviewController.getProductRatingStats));

// Shop reviews
router.get("/shop/:shopId", wrapRequestHandler(reviewController.getReviewsByShop));
router.get("/shop/:shopId/stats", wrapRequestHandler(reviewController.getShopRatingStats));
router.get("/shop/:shopId/unreplied-count", wrapRequestHandler(reviewController.getUnrepliedReviewsCount));

// Single review
router.get("/:reviewId", wrapRequestHandler(reviewController.getReviewById));

// Protected routes (require authentication)
router.use(authenticate);

// Customer routes - Create and manage own reviews
router.post(
  "/",
  checkPermission(PERMISSIONS.REVIEW_CREATE),
  wrapRequestHandler(reviewController.createReview)
);

router.get(
  "/me/my-reviews",
  checkPermission(PERMISSIONS.REVIEW_VIEW),
  wrapRequestHandler(reviewController.getMyReviews)
);

router.put(
  "/:reviewId",
  checkPermission(PERMISSIONS.REVIEW_UPDATE),
  wrapRequestHandler(reviewController.updateReview)
);

router.delete(
  "/:reviewId",
  checkPermission(PERMISSIONS.REVIEW_DELETE),
  wrapRequestHandler(reviewController.deleteReview)
);

// Moderator routes - Moderate reviews
router.get(
  "/moderation/all",
  checkPermission(PERMISSIONS.REVIEW_MODERATE),
  wrapRequestHandler(reviewController.getAllReviewsForModeration)
);

router.patch(
  "/:reviewId/hide",
  checkPermission(PERMISSIONS.REVIEW_HIDE),
  wrapRequestHandler(reviewController.hideReview)
);

router.patch(
  "/:reviewId/unhide",
  checkPermission(PERMISSIONS.REVIEW_HIDE),
  wrapRequestHandler(reviewController.unhideReview)
);

// Seller route - Reply to review (once per review)
router.post(
  "/:reviewId/reply",
  checkPermission(PERMISSIONS.REVIEW_REPLY),
  wrapRequestHandler(reviewController.replyToReview)
);

export default router;
