/**
 * API Client for Backend using Axios
 * Handles all API requests with automatic token management
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/lib/auth";

const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  const isClient = typeof globalThis.window !== "undefined";
  
  if (isClient) {
    return "/api";
  }
  
  if (process.env.API_URL) {
    return process.env.API_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }

  const isProduction = process.env.NODE_ENV === "production";
  return isProduction ? "/api" : "http://localhost:3001/api";
};

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

class ApiClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = getApiUrl();
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      withCredentials: true,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
      },
    });

    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (config.data instanceof FormData && config.headers) {
          delete (config.headers as any)["Content-Type"];
          delete (config.headers as any)["content-type"];
        }
        
        if (config.headers) {
          config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
          config.headers["Pragma"] = "no-cache";
          
          if (config.url?.includes("/auth/me")) {
            config.params = { ...config.params, _t: Date.now() };
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (typeof globalThis.window !== "undefined" && response.config.url?.includes("/auth/me")) {
          const hasCookie = globalThis.document.cookie.includes("accessToken=");
          const hasLocalStorage = !!globalThis.localStorage?.getItem("accessToken");
          
          if (response.status === 304) {
            if (!hasCookie && !hasLocalStorage) {
              this.clearToken();
              useAuthStore.getState().logout();
              
              const currentPath = globalThis.window.location.pathname;
              const publicPaths = ["/", "/login", "/register", "/products", "/categories", "/sellers"];
              const isPublicPath = publicPaths.some((path) => currentPath.startsWith(path)) || 
                                   currentPath === "/404" || 
                                   currentPath.startsWith("/_next");
              
              if (!isPublicPath) {
                globalThis.window.location.href = "/login";
              }
              return Promise.reject(new Error("Cookie deleted - authentication required"));
            }
            return Promise.reject({
              response: {
                status: 304,
                statusText: "Not Modified",
                data: null,
              },
              config: response.config,
              message: "304 Not Modified - retry needed",
              isAxiosError: true,
            });
          }
          
          if (!hasCookie && !hasLocalStorage) {
            this.clearToken();
            useAuthStore.getState().logout();
          }
        }
        return response;
      },
      (error: AxiosError<ApiResponse>) => {
        const isApiCall =
          error.config?.url &&
          (error.config.url.startsWith(this.baseUrl) ||
            error.config.url.startsWith("/api") ||
            error.config.url.includes("/api/"));

        if (error.response?.status === 401 && isApiCall) {
          this.clearToken();
          useAuthStore.getState().logout();

          if (typeof globalThis.window !== "undefined") {
            const currentPath = globalThis.window.location.pathname;
            const publicPaths = [
              "/",
              "/login",
              "/register",
              "/products",
              "/categories",
              "/sellers",
            ];
            const isPublicPath =
              publicPaths.some((path) => currentPath.startsWith(path)) ||
              currentPath === "/404" ||
              currentPath.startsWith("/_next");

            if (!isPublicPath) {
              globalThis.window.location.href = "/login";
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof globalThis.window === "undefined") return null;
    
    const cookies = globalThis.document.cookie.split(";");
    const accessTokenCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("accessToken=")
    );
    
    if (accessTokenCookie) {
      return accessTokenCookie.split("=")[1];
    }
    
    return globalThis.localStorage.getItem("accessToken");
  }

  setToken(token: string): void {
    if (typeof globalThis.window !== "undefined") {
      globalThis.localStorage.setItem("accessToken", token);
    }
  }

  clearToken(): void {
    if (typeof globalThis.window !== "undefined") {
      globalThis.localStorage.removeItem("accessToken");
    }
  }

  async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      if (endpoint.includes("/products/featured") || endpoint.includes("/products/top")) {
        console.log("[API Client] ===== Making request =====");
        console.log("[API Client] Endpoint:", endpoint);
        console.log("[API Client] Base URL:", this.baseUrl);
        console.log("[API Client] Full URL:", `${this.baseUrl}${endpoint}`);
        console.log("[API Client] Config:", config);
      }
      const response = await this.axiosInstance.get<ApiResponse<T>>(endpoint, config);
      
      if (endpoint.includes("/products")) {
        console.log("[API Client] Products response:", {
          endpoint,
          status: response.status,
          success: response.data?.success,
          hasData: !!response.data?.data,
          dataType: Array.isArray(response.data?.data) ? "array" : typeof response.data?.data,
          dataLength: Array.isArray(response.data?.data) ? response.data.data.length : "N/A",
          firstItem: Array.isArray(response.data?.data) && response.data.data.length > 0 ? {
            id: (response.data.data[0] as any)?._id || (response.data.data[0] as any)?.id,
            title: (response.data.data[0] as any)?.title,
            hasSalesCount: (response.data.data[0] as any)?.salesCount !== undefined,
            salesCount: (response.data.data[0] as any)?.salesCount,
            keys: Object.keys(response.data.data[0] || {}),
          } : null,
          fullResponse: endpoint.includes("/featured") || endpoint.includes("/top") ? response.data : undefined,
        });
      }
      
      return response.data;
    } catch (error) {
      if (endpoint.includes("/products/featured") || endpoint.includes("/products/top")) {
        console.error("[API Client] Error for", endpoint, ":", error);
        console.error("[API Client] Error details:", {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          response: (error as any)?.response?.data,
          status: (error as any)?.response?.status,
        });
      }
      throw this.handleError(error);
    }
  }

  async post<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.post<ApiResponse<T>>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.put<ApiResponse<T>>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch<T>(endpoint: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<ApiResponse<T>>(endpoint, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<ApiResponse<T>>(endpoint, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse>;
      return {
        message: axiosError.response?.data?.message || axiosError.message || "Network error occurred",
        status: axiosError.response?.status || 500,
      };
    }
    return {
      message: "An unexpected error occurred",
      status: 500,
    };
  }
}

export const apiClient = new ApiClient();

export default apiClient;
