"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ReviewCard } from "./ReviewCard";
import { ReviewStats } from "./ReviewStats";
import type { Review, RatingStats } from "@/lib/services/review.service";

interface ReviewListProps {
  reviews: Review[];
  stats?: RatingStats;
  currentUserId?: string;
  isModerator?: boolean;
  // Pagination
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  // Filtering
  selectedRating?: number;
  onRatingFilter?: (rating: number | undefined) => void;
  // Actions
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onHide?: (reviewId: string) => void;
  onUnhide?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  // State
  isLoading?: boolean;
  className?: string;
}

const ratingFilters = [
  { value: undefined, label: "Tất cả" },
  { value: 5, label: "5 sao" },
  { value: 4, label: "4 sao" },
  { value: 3, label: "3 sao" },
  { value: 2, label: "2 sao" },
  { value: 1, label: "1 sao" },
];

export function ReviewList({
  reviews,
  stats,
  currentUserId,
  isModerator = false,
  page,
  totalPages,
  onPageChange,
  selectedRating,
  onRatingFilter,
  onEdit,
  onDelete,
  onHide,
  onUnhide,
  onReport,
  isLoading = false,
  className,
}: ReviewListProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Stats Section */}
      {stats && (
        <ReviewStats
          averageRating={stats.averageRating}
          totalReviews={stats.totalReviews}
          ratingDistribution={stats.ratingDistribution}
        />
      )}

      {/* Rating Filter */}
      {onRatingFilter && (
        <div className="flex flex-wrap gap-2">
          {ratingFilters.map((filter) => (
            <Button
              key={filter.label}
              variant={selectedRating === filter.value ? "default" : "outline"}
              size="sm"
              onClick={() => onRatingFilter(filter.value)}
              className="text-sm"
            >
              {filter.label}
            </Button>
          ))}
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <ReviewSkeleton key={index} />
          ))
        ) : reviews.length === 0 ? (
          // Empty state
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có đánh giá</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {selectedRating
                  ? `Không có đánh giá ${selectedRating} sao nào`
                  : "Hãy là người đầu tiên đánh giá sản phẩm này"}
              </p>
            </CardContent>
          </Card>
        ) : (
          // Reviews
          reviews.map((review) => (
            <ReviewCard
              key={review._id}
              review={review}
              currentUserId={currentUserId}
              isModerator={isModerator}
              onEdit={onEdit}
              onDelete={onDelete}
              onHide={onHide}
              onUnhide={onUnhide}
              onReport={onReport}
            />
          ))
        )}
      </div>

      {/* Pagination - chỉ hiển thị khi có onPageChange và totalPages > 1 */}
      {onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            {generatePageNumbers(page, totalPages).map((pageNum, index) =>
              pageNum === "..." ? (
                <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                  ...
                </span>
              ) : (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(pageNum as number)}
                  disabled={isLoading}
                  className="w-9 h-9"
                >
                  {pageNum}
                </Button>
              )
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isLoading}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function to generate page numbers with ellipsis
function generatePageNumbers(
  currentPage: number,
  totalPages: number
): (number | "...")[] {
  const pages: (number | "...")[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);

    if (currentPage > 3) {
      pages.push("...");
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }

    // Always show last page
    pages.push(totalPages);
  }

  return pages;
}

// Loading skeleton component
function ReviewSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        <Skeleton className="h-16 w-full mt-3" />
      </CardContent>
    </Card>
  );
}
