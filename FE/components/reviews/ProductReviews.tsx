"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";
import { reviewService } from "@/lib/services/review.service";
import { useProductReviews, SocketReviewPayload } from "@/lib/hooks/useSocket";
import type {
  Review,
  RatingStats,
  CreateReviewRequest,
  UpdateReviewRequest,
} from "@/lib/services/review.service";

interface ProductReviewsProps {
  productId: string;
  currentUserId?: string;
  className?: string;
}

export function ProductReviews({
  productId,
  currentUserId,
  className,
}: ProductReviewsProps) {
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        reviewService.getReviewsByProduct(productId, page, 10, ratingFilter),
        reviewService.getProductRatingStats(productId),
      ]);

      setReviews(reviewsResponse.reviews);
      setTotalPages(reviewsResponse.totalPages);
      setStats(statsResponse);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setIsLoading(false);
    }
  }, [productId, page, ratingFilter]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Real-time updates via WebSocket
  useProductReviews(
    productId,
    // On review created
    useCallback(
      (payload: SocketReviewPayload) => {
        if (payload.productId === productId) {
          // Refresh reviews to get the new review
          fetchReviews();
          toast.success("Có đánh giá mới!");
        }
      },
      [productId, fetchReviews]
    ),
    // On review updated
    useCallback(
      (payload: SocketReviewPayload) => {
        if (payload.productId === productId) {
          setReviews((prev) =>
            prev.map((r) =>
              r._id === payload.reviewId
                ? {
                    ...r,
                    rating: payload.rating ?? r.rating,
                    comment: payload.comment ?? r.comment,
                    images: payload.images ?? r.images,
                  }
                : r
            )
          );
          // Update stats if provided
          if (payload.productRatingAvg !== undefined && stats) {
            setStats({
              ...stats,
              averageRating: payload.productRatingAvg,
            });
          }
        }
      },
      [productId, stats]
    ),
    // On review deleted
    useCallback(
      (payload: SocketReviewPayload) => {
        if (payload.productId === productId) {
          setReviews((prev) => prev.filter((r) => r._id !== payload.reviewId));
          // Refresh stats
          fetchReviews();
        }
      },
      [productId, fetchReviews]
    )
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle rating filter
  const handleRatingFilter = (rating: number | undefined) => {
    setRatingFilter(rating);
    setPage(1); // Reset to first page when filter changes
  };

  // Handle edit
  const handleEdit = (review: Review) => {
    setEditingReview(review);
  };

  // Handle update review
  const handleUpdateReview = async (data: CreateReviewRequest | UpdateReviewRequest) => {
    if (!editingReview) return;

    try {
      await reviewService.updateReview(editingReview._id, data as UpdateReviewRequest);
      toast.success("Đã cập nhật đánh giá");
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      toast.error("Không thể cập nhật đánh giá");
      throw error;
    }
  };

  // Handle delete
  const handleDelete = (reviewId: string) => {
    setDeletingReviewId(reviewId);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!deletingReviewId) return;

    try {
      await reviewService.deleteReview(deletingReviewId);
      toast.success("Đã xóa đánh giá");
      setDeletingReviewId(null);
      fetchReviews();
    } catch {
      toast.error("Không thể xóa đánh giá");
    }
  };

  // Handle report (placeholder)
  const handleReport = (reviewId: string) => {
    toast.info("Chức năng báo cáo sẽ được triển khai sau");
  };

  return (
    <div className={className}>
      <ReviewList
        reviews={reviews}
        stats={stats || undefined}
        currentUserId={currentUserId}
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        selectedRating={ratingFilter}
        onRatingFilter={handleRatingFilter}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onReport={handleReport}
        isLoading={isLoading}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
          </DialogHeader>
          {editingReview && (
            <ReviewForm
              review={editingReview}
              onSubmit={handleUpdateReview}
              onCancel={() => setEditingReview(null)}
              className="border-0 shadow-none"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingReviewId}
        onOpenChange={() => setDeletingReviewId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa đánh giá</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
