/**
 * Hook to manage shop state
 */

import { useState, useEffect } from "react";
import { shopService, Shop } from "@/lib/services/shop.service";
import { useAuthStore } from "@/lib/auth";

export function useShop() {
  const { isAuthenticated } = useAuthStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setShop(null);
      return;
    }

    loadShop();
  }, [isAuthenticated]);

  const loadShop = async () => {
    try {
      setLoading(true);
      setError(null);
      const myShop = await shopService.getMyShop();
      setShop(myShop);
    } catch (err: any) {
      // If shop not found, it's ok - user just doesn't have a shop yet
      if (err?.status !== 404) {
        setError(err.message || "Failed to load shop");
      }
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  return {
    shop,
    loading,
    error,
    hasActiveShop: shop?.status === "Active",
    hasPendingShop: shop?.status === "Pending",
    refetch: loadShop,
  };
}
