"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, CheckCircle } from "lucide-react";
import { SellerDashboardResponse } from "@/types/report";

interface SalesSectionProps {
  dashboard: SellerDashboardResponse | null;
}

const formatPrice = (price: number) => {
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)}B`;
  }
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

export function SalesSection({ dashboard }: SalesSectionProps) {
  const revenue = dashboard?.revenue;
  const orders = dashboard?.orders;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Phân tích bán hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Hôm nay</p>
            <p className="text-lg font-bold text-green-600">
              {formatPrice(revenue?.todayRevenue ?? 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tuần này</p>
            <p className="text-lg font-bold text-blue-600">
              {formatPrice(revenue?.weekRevenue ?? 0)}
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">Tháng này</p>
            <p className="text-lg font-bold text-purple-600">
              {formatPrice(revenue?.monthRevenue ?? 0)}
            </p>
          </div>
        </div>

        {/* Order Stats */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">Đơn hàng hôm nay</span>
          </div>
          <span className="font-semibold">{orders?.todayOrders ?? 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Đã hoàn thành</span>
          </div>
          <span className="font-semibold text-green-600">
            {orders?.completed ?? 0}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
