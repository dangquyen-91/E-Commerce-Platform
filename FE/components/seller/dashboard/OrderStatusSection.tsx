"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag } from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import { SellerOrderOverviewResponse } from "@/types/report";

// Order statuses for digital key/account platform
const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  // OrderStatus
  PendingPayment: { label: "Chờ thanh toán", color: "bg-yellow-500", bgColor: "bg-yellow-100" },
  Paid: { label: "Đã thanh toán", color: "bg-blue-500", bgColor: "bg-blue-100" },
  Completed: { label: "Hoàn thành", color: "bg-green-600", bgColor: "bg-green-100" },
  Cancelled: { label: "Đã hủy", color: "bg-gray-500", bgColor: "bg-gray-100" },
  Disputed: { label: "Đang tranh chấp", color: "bg-orange-500", bgColor: "bg-orange-100" },
  Refunded: { label: "Đã hoàn tiền", color: "bg-red-500", bgColor: "bg-red-100" },
  // OrderItemStatus (if mixed)
};

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export function OrderStatusSection() {
  const [data, setData] = useState<SellerOrderOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);

        const res = await reportService.getSellerOrderOverview({
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        });

        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch order overview", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Phân bổ đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[180px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Phân bổ đơn hàng (30 ngày)
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            Tổng: {data.totalOrders} đơn
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b">
          <div className="text-center">
            <p className="text-2xl font-bold">{data.totalOrders}</p>
            <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatPrice(data.averageOrderValue)}
            </p>
            <p className="text-xs text-muted-foreground">Giá trị TB/đơn</p>
          </div>
        </div>

        {/* Status Breakdown */}
        <div className="space-y-3">
          {data.byStatus
            .filter((item) => !["WaitingDelivery", "Delivered"].includes(item.status))
            .map((item) => {
            const config = STATUS_CONFIG[item.status] || {
              label: item.status,
              color: "bg-gray-500",
              bgColor: "bg-gray-100",
            };

            return (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${config.color}`} />
                    {config.label}
                  </span>
                  <span className="font-medium">
                    {item.count} ({item.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className={`h-2 w-full rounded-full ${config.bgColor}`}>
                  <div
                    className={`h-full rounded-full ${config.color}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
