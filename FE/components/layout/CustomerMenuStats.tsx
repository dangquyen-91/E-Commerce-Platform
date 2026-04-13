"use client";

import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api";

interface CustomerStats {
  totalOrders: number;
  pendingOrders: number;
  walletBalance: number;
  supportTickets: number;
}

export function CustomerMenuStats() {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Fetch customer dashboard stats from backend API
        const response = await apiClient.get<CustomerStats>("/users/profile/stats");
        if (response.success && response.data) {
          setStats(response.data);
          setIsLoading(false);
          return;
        }
        
        // Initialize with empty data if API returns no data
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          walletBalance: 0,
          supportTickets: 0,
        });
      } catch {
        // Initialize with empty data on error
        setStats({
          totalOrders: 0,
          pendingOrders: 0,
          walletBalance: 0,
          supportTickets: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <>
        <Separator className="my-2" />
        <div className="px-2 py-1.5 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </>
    );
  }

  if (!stats) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Only show if there's meaningful data
  if (stats.totalOrders === 0 && stats.walletBalance === 0 && stats.supportTickets === 0) {
    return null;
  }

  return (
    <>
      <Separator className="my-2" />
      <div className="px-2 py-1.5 space-y-2">
        {stats.totalOrders > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tổng đơn hàng</span>
            <span className="font-medium">{stats.totalOrders}</span>
          </div>
        )}
        {stats.pendingOrders > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Đang xử lý</span>
            <span className="font-medium text-orange-600">{stats.pendingOrders}</span>
          </div>
        )}
        {stats.walletBalance > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Số dư ví</span>
            <span className="font-medium text-blue-600">{formatCurrency(stats.walletBalance)}</span>
          </div>
        )}
        {stats.supportTickets > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ticket hỗ trợ</span>
            <span className="font-medium text-orange-600">{stats.supportTickets}</span>
          </div>
        )}
      </div>
    </>
  );
}
