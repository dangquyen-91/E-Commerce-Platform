"use client";

import { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { reportService } from "@/lib/services/report.service";
import { OrderStatusResponse } from "@/types/report";

// Order statuses for digital key/account platform
const STATUS_COLORS: Record<string, string> = {
  PendingPayment: "#f59e0b",
  Paid: "#3b82f6",
  WaitingDelivery: "#8b5cf6",
  Delivered: "#10b981",
  Completed: "#059669",
  Disputed: "#f97316",
  Cancelled: "#6b7280",
  Refunded: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  PendingPayment: "Chờ thanh toán",
  Paid: "Đã thanh toán",
  WaitingDelivery: "Chờ giao key",
  Delivered: "Đã giao key",
  Completed: "Hoàn thành",
  Disputed: "Đang tranh chấp",
  Cancelled: "Đã hủy",
  Refunded: "Đã hoàn tiền",
};

export function AdminOrderChart() {
  const [data, setData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);

        const res = await reportService.getOrdersByStatus({
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
        });

        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch order stats", err);
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
          <CardTitle className="text-base font-medium">Đơn hàng theo trạng thái</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const chartData = data.byStatus
    .filter((item) => !["Cancelled", "PendingPayment"].includes(item.status))
    .map((item) => ({
      status: STATUS_LABELS[item.status] || item.status,
      count: item.count,
      color: STATUS_COLORS[item.status] || "#6b7280",
    }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Đơn hàng theo trạng thái (30 ngày)</CardTitle>
          <span className="text-sm text-muted-foreground">
            Tổng: {data.total.toLocaleString()} đơn
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="status"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value) => Number(value).toLocaleString() + " đơn"}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb" }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
