"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { ShopStats } from "@/lib/services/shop.service";
import { SellerDashboardResponse } from "@/types/report";

interface FinanceSectionProps {
  stats: ShopStats | null;
  dashboard: SellerDashboardResponse | null;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export function FinanceSection({ stats, dashboard }: FinanceSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Tài chính
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/wallet" className="text-xs">
              Chi tiết <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Available Balance */}
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">Số dư khả dụng</span>
          </div>
          <span className="font-bold text-green-600">
            {formatPrice(stats?.availableBalance ?? 0)}
          </span>
        </div>

        {/* Escrow */}
        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-gray-600">Đang tạm giữ</span>
          </div>
          <span className="font-semibold text-yellow-600">
            {formatPrice(stats?.escrowAmount ?? 0)}
          </span>
        </div>

        {/* Pending Payout */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">Chờ thanh toán</span>
          </div>
          <span className="font-semibold text-blue-600">
            {formatPrice(dashboard?.revenue.pendingPayout ?? 0)}
          </span>
        </div>

        {/* Total Received */}
        <div className="flex items-center justify-between pt-3 border-t">
          <span className="text-sm text-gray-500">Tổng đã nhận</span>
          <span className="font-semibold">
            {formatPrice(stats?.paidOutAmount ?? 0)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
