"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MessageCircle, TrendingUp } from "lucide-react";
import { Shop, ShopStats } from "@/lib/services/shop.service";

interface PerformanceSectionProps {
  shop: Shop | null;
  stats: ShopStats | null;
}

export function PerformanceSection({ shop, stats }: PerformanceSectionProps) {
  const avgRating = stats?.avgRating ?? shop?.ratingAvg ?? 0;
  const totalReviews = stats?.totalReviews ?? shop?.reviewCount ?? 0;
  const responseRate = shop?.responseRate ?? 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Hiệu suất Shop
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {/* Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
              <span className="text-xl font-bold">{avgRating.toFixed(1)}</span>
              <span className="text-gray-400 text-sm">/5</span>
            </div>
            <p className="text-xs text-gray-500">
              {totalReviews} đánh giá
            </p>
          </div>

          {/* Response Rate */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MessageCircle className="h-5 w-5 text-blue-500" />
              <span className="text-xl font-bold">{responseRate}%</span>
            </div>
            <p className="text-xs text-gray-500">Tỷ lệ phản hồi</p>
          </div>

          {/* Total Products */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xl font-bold">{stats?.approvedProducts ?? 0}</span>
              <span className="text-gray-400 text-sm">/{stats?.totalProducts ?? 0}</span>
            </div>
            <p className="text-xs text-gray-500">SP đang bán</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
