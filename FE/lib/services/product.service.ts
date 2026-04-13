/**
 * Product Service
 * Handles all product-related API requests
 */

import { apiClient, type ApiResponse } from "../api";
import { type CreateProductInput, type UpdateProductInput } from "../validations";

// Matches BE product model shape loosely (fields may be more/less depending on BE response)
export interface ProductResponse {
  _id?: string;
  id?: string;
  shopId: string;
  platformId: string;
  title: string;
  description: string;
  warrantyPolicy: string;
  howToUse: string;
  thumbnailUrl?: string | null;
  planType: "Personal" | "Family" | "Slot" | "Shared" | "InviteLink";
  durationDays: number;
  price: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  salesCount?: number; // Number of items sold
  avgRating?: number; // Average rating
  reviewCount?: number; // Number of reviews
}

// Backend returns: { success, data: ProductResponse[], pagination }
// We model data as ProductResponse[] and rely on ApiResponse.pagination for meta.
export interface PaginatedProductsResponse {
  data: ProductResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilter {
  shopId?: string;
  platformId?: string;
  planType?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

class ProductService {
  /**
   * Get product by ID (public)
   */
  async getProductById(productId: string): Promise<ApiResponse<ProductResponse>> {
    return apiClient.get<ProductResponse>(`/products/${productId}`);
  }

  /**
   * Create a new product for the seller
   */
  async createProduct(
    data: CreateProductInput
  ): Promise<ApiResponse<ProductResponse>> {
    return apiClient.post<ProductResponse>("/products", data);
  }

  /**
   * Get public products with filtering and pagination
   */
  async getProducts(
    filter?: ProductFilter
  ): Promise<ApiResponse<ProductResponse[]>> {
    return apiClient.get<ProductResponse[]>("/products", {
      params: filter,
    });
  }

  /**
   * Get all products for a specific shop (for seller)
   */
  async getMyProducts(shopId: string): Promise<ApiResponse<ProductResponse[]>> {
    return apiClient.get<ProductResponse[]>(`/products/shop/${shopId}`);
  }

  /**
   * Get my product by id (for seller)
   */
  async getMyProductById(productId: string): Promise<ApiResponse<ProductResponse>> {
    return apiClient.get<ProductResponse>(`/products/me/${productId}`);
  }

  /**
   * Update product (for seller)
   */
  async updateProduct(
    productId: string,
    data: UpdateProductInput
  ): Promise<ApiResponse<ProductResponse>> {
    return apiClient.put<ProductResponse>(`/products/${productId}`, data);
    }

  /**
   * Delete a product by its ID (for seller)
   */
  async deleteProduct(productId: string): Promise<ApiResponse<null>> {
    return apiClient.delete<null>(`/products/${productId}`);
  }

  /**
   * Get featured products (based on rating and sales)
   */
  async getFeaturedProducts(limit: number = 4): Promise<ApiResponse<ProductResponse[]>> {
    return apiClient.get<ProductResponse[]>("/products/featured", {
      params: { limit },
    });
  }

  /**
   * Get top products (best selling and highest rated)
   */
  async getTopProducts(limit: number = 5): Promise<ApiResponse<ProductResponse[]>> {
    return apiClient.get<ProductResponse[]>("/products/top", {
      params: { limit },
    });
  }
}

export const productService = new ProductService();
