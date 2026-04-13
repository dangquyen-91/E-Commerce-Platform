/**
 * Hook to fetch products from API
 */

import { useState, useEffect, useCallback } from "react";
import { productService, ProductResponse, ProductFilter } from "@/lib/services/product.service";

// Debug logger - only logs in development
const DEBUG = process.env.NODE_ENV === "development";
const log = (hook: string, action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[${hook}] ${action}`, data ?? "");
  }
};

export interface UseProductsOptions {
  initialFilter?: ProductFilter;
  autoFetch?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { initialFilter, autoFetch = true } = options;

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ProductFilter>(initialFilter || {});

  const fetchProducts = useCallback(async (newFilter?: ProductFilter) => {
    try {
      setLoading(true);
      setError(null);
      const filterToUse = newFilter || filter;
      const response = await productService.getProducts(filterToUse);
      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        setProducts([]);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load products";
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  const updateFilter = useCallback((newFilter: ProductFilter) => {
    setFilter(newFilter);
    fetchProducts(newFilter);
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    filter,
    setFilter: updateFilter,
    refetch: fetchProducts,
  };
}

export function useFeaturedProducts(limit: number = 6) {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log("useFeaturedProducts", "init", { limit });
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getFeaturedProducts(limit);
        if (response.success && response.data) {
          setProducts(response.data);
          log("useFeaturedProducts", "success", { count: response.data.length });
        } else {
          setProducts([]);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load products";
        log("useFeaturedProducts", "error", errorMessage);
        setError(errorMessage);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, [limit]);

  return { products, loading, error };
}

export function useTopProducts(limit: number = 5) {
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    log("useTopProducts", "init", { limit });
    const fetchTop = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await productService.getTopProducts(limit);
        if (response.success && response.data) {
          setProducts(response.data);
          log("useTopProducts", "success", { count: response.data.length });
        } else {
          setProducts([]);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load products";
        log("useTopProducts", "error", errorMessage);
        setError(errorMessage);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTop();
  }, [limit]);

  return { products, loading, error };
}
