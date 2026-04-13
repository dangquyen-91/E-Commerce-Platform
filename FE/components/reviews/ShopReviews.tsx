"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ReviewList } from "./ReviewList";
import { reviewService } from "@/lib/services/review.service";
import { useShopReviews, SocketReviewPayload } from "@/lib/hooks/useSocket";
import type { Review, RatingStats } from "@/lib/services/review.service";
import { ChevronRight } from "lucide-react";

interface ShopReviewsProps {
  shopId: string;
  className?: string;
  /** Giới hạn số đánh giá hiển thị. Nếu set, sẽ ẩn phân trang */
  limit?: number;
  /** Hiển thị link xem tất cả đánh giá */
  showViewAll?: boolean;
}

export function ShopReviews({ shopId, className, limit, showViewAll = false }: ShopReviewsProps) {
  // State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Số lượng đánh giá mỗi trang (nếu có limit thì dùng limit, không thì 10)
  const pageSize = limit || 10;

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reviewsResponse, statsResponse] = await Promise.all([
        reviewService.getReviewsByShop(shopId, page, pageSize),
        reviewService.getShopRatingStats(shopId),
      ]);

      setReviews(reviewsResponse.reviews);
      setTotalPages(reviewsResponse.totalPages);
      setStats(statsResponse);
    } catch {
      toast.error("Không thể tải đánh giá");
    } finally {
      setIsLoading(false);
    }
  }, [shopId, page, pageSize]);

  // Initial fetch
  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Real-time updates via WebSocket
  useShopReviews(
    shopId,
    // On review created
    useCallback(
      (payload: SocketReviewPayload) => {
        if (payload.shopId === shopId) {
          fetchReviews();
        }
      },
      [shopId, fetchReviews]
    ),
    // On review updated
    useCallback(
      (payload: SocketReviewPayload) => {
        if (payload.shopId === shopId) {
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
          if (payload.shopRatingAvg !== undefined && stats) {
            setStats({
              ...stats,
              averageRating: payload.shopRatingAvg,
            });
          }
        }
      },
      [shopId, stats]
    ),
    // On review deleted
    useCallback(
      (payload: SocketReviewPayload) => {
        if (payload.shopId === shopId) {
          setReviews((prev) => prev.filter((r) => r._id !== payload.reviewId));
          fetchReviews();
        }
      },
      [shopId, fetchReviews]
    )
  );

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Nếu có limit, ẩn phân trang
  const hidePagination = !!limit;

  return (
    <div className={className}>
      <ReviewList
        reviews={reviews}
        stats={stats || undefined}
        page={hidePagination ? 1 : page}
        totalPages={hidePagination ? 1 : totalPages}
        onPageChange={hidePagination ? undefined : handlePageChange}
        isLoading={isLoading}
      />

      {/* Link xem tất cả đánh giá */}
      {showViewAll && stats && stats.totalReviews > (limit || 0) && (
        <div className="flex justify-center mt-4">
          <Button variant="outline" asChild>
            <Link href={`/shops/${shopId}/reviews`}>
              Xem tất cả {stats.totalReviews} đánh giá
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
