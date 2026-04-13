"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RatingStars } from "./RatingStars";

interface RatingDistribution {
  [key: number]: number;
}

interface ReviewStatsProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: RatingDistribution;
  className?: string;
}

export function ReviewStats({
  averageRating,
  totalReviews,
  ratingDistribution,
  className,
}: ReviewStatsProps) {
  // Ensure all ratings 1-5 exist in distribution
  const normalizedDistribution: RatingDistribution = {
    5: ratingDistribution[5] || 0,
    4: ratingDistribution[4] || 0,
    3: ratingDistribution[3] || 0,
    2: ratingDistribution[2] || 0,
    1: ratingDistribution[1] || 0,
  };

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  const getBarColor = (rating: number) => {
    if (rating >= 4) return "bg-green-500";
    if (rating === 3) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Average Rating Section */}
          <div className="flex flex-col items-center justify-center md:border-r md:pr-6 md:min-w-[140px]">
            <span className="text-4xl font-bold text-foreground">
              {averageRating.toFixed(1)}
            </span>
            <RatingStars rating={averageRating} size="md" className="mt-2" />
            <span className="text-sm text-muted-foreground mt-2">
              {totalReviews} đánh giá
            </span>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = normalizedDistribution[rating];
              const percentage = getPercentage(count);

              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 shrink-0">
                    <span className="text-sm font-medium">{rating}</span>
                    <span className="text-yellow-400 text-sm">★</span>
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        getBarColor(rating)
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
