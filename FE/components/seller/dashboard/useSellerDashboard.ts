"use client";

import { useState, useEffect, useCallback } from "react";
import { shopService, Shop, ShopStats } from "@/lib/services/shop.service";
import { reportService } from "@/lib/services/report.service";
import { reviewService } from "@/lib/services/review.service";
import { SellerDashboardResponse } from "@/types/report";

export interface SellerDashboardData {
  shop: Shop | null;
  stats: ShopStats | null;
  dashboard: SellerDashboardResponse | null;
  unrepliedReviews: number;
}

export interface TodoItems {
  pendingDelivery: number;
  unrepliedReviews: number;
  pendingProducts: number;
  lowInventory: number;
}

export function useSellerDashboard() {
  const [data, setData] = useState<SellerDashboardData>({
    shop: null,
    stats: null,
    dashboard: null,
    unrepliedReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch shop info first
      const shop = await shopService.getMyShop();

      if (!shop) {
        setData({ shop: null, stats: null, dashboard: null, unrepliedReviews: 0 });
        setLoading(false);
        return;
      }

      // Fetch all data in parallel
      const [stats, dashboardRes, unrepliedCount] = await Promise.all([
        shopService.getMyShopStats(),
        reportService.getSellerDashboard(),
        reviewService.getUnrepliedReviewsCount(shop._id),
      ]);

      setData({
        shop,
        stats,
        dashboard: dashboardRes.success ? dashboardRes.data ?? null : null,
        unrepliedReviews: unrepliedCount,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Computed: Todo items
  const todoItems: TodoItems = {
    pendingDelivery: data.dashboard?.orders.pendingDelivery ?? 0,
    unrepliedReviews: data.unrepliedReviews,
    pendingProducts: data.stats?.pendingProducts ?? 0,
    lowInventory: (data.stats?.inventory.available ?? 0) < 10 ? 1 : 0,
  };

  // Computed: Has any todo
  const hasTodos = Object.values(todoItems).some((v) => v > 0);

  return {
    ...data,
    loading,
    error,
    todoItems,
    hasTodos,
    refetch: fetchData,
  };
}
