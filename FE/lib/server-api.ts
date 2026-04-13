/**
 * Server-Side API Client using native fetch()
 * For use in Server Components, generateMetadata, and generateStaticParams
 *
 * Key differences from lib/api.ts:
 * - Uses native fetch() instead of axios
 * - Supports Next.js caching and revalidation
 * - No client-side dependencies (no cookies, localStorage, window)
 */

import { type ApiResponse } from "./api";
import { type ProductResponse, type ProductFilter } from "./services/product.service";
import { type Shop } from "./services/shop.service";
import { type StatsResponse } from "./services/stats.service";

// Get API URL for server-side fetching
function getServerApiUrl(): string {
  // Priority: NEXT_PUBLIC_API_URL > API_URL > Vercel URL > localhost
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  // In Vercel production
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }

  // Local development
  return "http://localhost:3001/api";
}

const API_URL = getServerApiUrl();

export interface ServerFetchOptions {
  revalidate?: number | false; // seconds to cache, false = no cache
  tags?: string[]; // cache tags for revalidation
  cache?: RequestCache; // 'force-cache' | 'no-store' | etc.
}

/**
 * Base server fetch function with caching support
 */
async function serverFetch<T>(
  endpoint: string,
  options: ServerFetchOptions = {}
): Promise<ApiResponse<T>> {
  const { revalidate = 60, tags, cache } = options;

  const url = `${API_URL}${endpoint}`;

  const fetchOptions: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  // Configure caching
  if (cache) {
    fetchOptions.cache = cache;
  } else if (revalidate !== undefined) {
    fetchOptions.next = { revalidate };
    if (tags) {
      fetchOptions.next.tags = tags;
    }
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      // Handle HTTP errors
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        message: errorData.message,
      };
    }

    const data: ApiResponse<T> = await response.json();
    return data;
  } catch (error) {
    console.error(`[Server API] Error fetching ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

// ============================================
// PRODUCT ENDPOINTS
// ============================================

/**
 * Get product by ID (SSR/ISR friendly)
 * Cache for 60 seconds, tag with product ID for targeted revalidation
 */
export async function getServerProductById(
  productId: string,
  options?: ServerFetchOptions
): Promise<ProductResponse | null> {
  const response = await serverFetch<ProductResponse>(
    `/products/${productId}`,
    {
      revalidate: 60,
      tags: [`product-${productId}`],
      ...options,
    }
  );

  return response.success && response.data ? response.data : null;
}

/**
 * Get products list with filters (SSR friendly)
 * Cache for 30 seconds for listing pages
 */
export async function getServerProducts(
  filter?: ProductFilter,
  options?: ServerFetchOptions
): Promise<ProductResponse[]> {
  // Build query string
  const params = new URLSearchParams();
  if (filter) {
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }

  const queryString = params.toString();
  const endpoint = `/products${queryString ? `?${queryString}` : ""}`;

  const response = await serverFetch<ProductResponse[]>(endpoint, {
    revalidate: 30,
    tags: ["products"],
    ...options,
  });

  return response.success && response.data ? response.data : [];
}

/**
 * Get featured products (SSR friendly)
 * Cache for 5 minutes as this changes less frequently
 */
export async function getServerFeaturedProducts(
  limit: number = 4,
  options?: ServerFetchOptions
): Promise<ProductResponse[]> {
  const response = await serverFetch<ProductResponse[]>(
    `/products/featured?limit=${limit}`,
    {
      revalidate: 300, // 5 minutes
      tags: ["featured-products"],
      ...options,
    }
  );

  return response.success && response.data ? response.data : [];
}

/**
 * Get top products (SSR friendly)
 * Cache for 5 minutes
 */
export async function getServerTopProducts(
  limit: number = 5,
  options?: ServerFetchOptions
): Promise<ProductResponse[]> {
  const response = await serverFetch<ProductResponse[]>(
    `/products/top?limit=${limit}`,
    {
      revalidate: 300, // 5 minutes
      tags: ["top-products"],
      ...options,
    }
  );

  return response.success && response.data ? response.data : [];
}

// ============================================
// SHOP ENDPOINTS
// ============================================

/**
 * Get shop by ID (SSR friendly)
 * Cache for 60 seconds
 */
export async function getServerShopById(
  shopId: string,
  options?: ServerFetchOptions
): Promise<Shop | null> {
  const response = await serverFetch<Shop>(
    `/shops/${shopId}`,
    {
      revalidate: 60,
      tags: [`shop-${shopId}`],
      ...options,
    }
  );

  return response.success && response.data ? response.data : null;
}

/**
 * Get products by shop ID
 */
export async function getServerProductsByShop(
  shopId: string,
  options?: ServerFetchOptions
): Promise<ProductResponse[]> {
  const response = await serverFetch<ProductResponse[]>(
    `/products/shop/${shopId}`,
    {
      revalidate: 60,
      tags: [`shop-${shopId}-products`],
      ...options,
    }
  );

  return response.success && response.data ? response.data : [];
}

// ============================================
// STATS ENDPOINTS
// ============================================

/**
 * Get platform statistics (SSR friendly)
 * Cache for 5 minutes
 */
export async function getServerStats(
  options?: ServerFetchOptions
): Promise<StatsResponse | null> {
  const response = await serverFetch<StatsResponse>("/stats", {
    revalidate: 300, // 5 minutes
    tags: ["platform-stats"],
    ...options,
  });

  return response.success && response.data ? response.data : null;
}

// ============================================
// REVIEWS ENDPOINTS
// ============================================

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

/**
 * Get product rating stats
 */
export async function getServerProductRatingStats(
  productId: string,
  options?: ServerFetchOptions
): Promise<RatingStats | null> {
  const response = await serverFetch<RatingStats>(
    `/reviews/product/${productId}/stats`,
    {
      revalidate: 60,
      tags: [`product-${productId}-reviews`],
      ...options,
    }
  );

  return response.success && response.data ? response.data : null;
}

/**
 * Get shop rating stats
 */
export async function getServerShopRatingStats(
  shopId: string,
  options?: ServerFetchOptions
): Promise<RatingStats | null> {
  const response = await serverFetch<RatingStats>(
    `/reviews/shop/${shopId}/stats`,
    {
      revalidate: 60,
      tags: [`shop-${shopId}-reviews`],
      ...options,
    }
  );

  return response.success && response.data ? response.data : null;
}

// ============================================
// INVENTORY ENDPOINTS
// ============================================

/**
 * Get available inventory count for a product
 */
export async function getServerInventoryCount(
  productId: string,
  options?: ServerFetchOptions
): Promise<number> {
  const response = await serverFetch<{ count: number }>(
    `/inventory/product/${productId}/count`,
    {
      revalidate: 30, // 30 seconds - inventory changes frequently
      tags: [`inventory-${productId}`],
      ...options,
    }
  );

  return response.success && response.data ? response.data.count : 0;
}

// ============================================
// UTILITY EXPORTS
// ============================================

export { serverFetch, API_URL };
