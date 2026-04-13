/**
 * Authentication Service
 * Handles login, register, logout, and token management
 */

import { apiClient } from "../api";
import { useAuthStore } from "../auth";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterSellerRequest {
  email: string;
  password: string;
  fullName: string;
  shopName: string;
  description?: string | null;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    roleKey: string;
  };
  token: string;
  refreshToken: string;
}

export interface RegisterResponse {
  id: string;
  email: string;
  fullName: string;
}

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  roleKey: string;
  roleName: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  trustLevel: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", credentials);
    
    if (response.success && response.data) {
      // Store token in localStorage (cookies are set by backend)
      apiClient.setToken(response.data.token);
      
      // Update auth store
      useAuthStore.getState().setUser({
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.fullName,
        role: this.mapRoleKeyToRole(response.data.user.roleKey),
        roleId: response.data.user.id, // Will be updated when fetching full user data
        emailVerified: false,
        phoneVerified: false,
        trustLevel: "new",
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      return response.data;
    }
    
    throw new Error(response.message || "Login failed");
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>("/auth/register", data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Registration failed");
  }

  /**
   * Register seller
   */
  async registerSeller(data: RegisterSellerRequest): Promise<any> {
    const response = await apiClient.post<any>("/auth/register/seller", {
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      shopName: data.shopName,
      description: data.description || null,
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Seller registration failed");
  }

  /**
   * Get current user info
   */
  async getMe(): Promise<UserResponse> {
    const response = await apiClient.get<UserResponse>("/auth/me");
    
    if (response.success && response.data) {
      // Update auth store with full user data
      useAuthStore.getState().setUser({
        id: response.data.id,
        email: response.data.email,
        name: response.data.fullName,
        role: this.mapRoleKeyToRole(response.data.roleKey),
        roleId: response.data.id, // Should be roleId from backend
        emailVerified: response.data.emailVerified,
        phoneVerified: response.data.phoneVerified || false,
        trustLevel: this.mapTrustLevel(response.data.trustLevel),
        status: response.data.status.toLowerCase() as "active" | "locked" | "banned",
        phone: response.data.phone,
        avatar: response.data.avatarUrl,
        createdAt: new Date(response.data.createdAt),
        updatedAt: new Date(response.data.updatedAt),
      });
      
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get user info");
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post<{ token: string }>("/auth/refresh", {});
    
    if (response.success && response.data) {
      apiClient.setToken(response.data.token);
      return response.data;
    }
    
    throw new Error(response.message || "Token refresh failed");
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout", {});
    } catch {
      // Continue with logout even if API call fails
    } finally {
      // Clear token and auth store
      apiClient.clearToken();
      useAuthStore.getState().logout();
      
      // Redirect to home page
      if (typeof globalThis.window !== "undefined") {
        globalThis.window.location.href = "/";
      }
    }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Password change failed");
    }
  }

  /**
   * Verify email with code
   * NOTE: Backend API needs to be implemented
   */
  async verifyEmail(code: string): Promise<void> {
    const response = await apiClient.post("/auth/verify-email", {
      code,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Email verification failed");
    }
    
    // Update emailVerified status in store if user is logged in
    const user = useAuthStore.getState().user;
    if (user) {
      useAuthStore.getState().setUser({
        ...user,
        emailVerified: true,
      });
    }
  }

  /**
   * Resend verification email
   * NOTE: Backend API needs to be implemented
   */
  async resendVerificationEmail(): Promise<void> {
    const response = await apiClient.post("/auth/resend-verification", {});
    
    if (!response.success) {
      throw new Error(response.message || "Failed to resend verification email");
    }
  }

  /**
   * Request password reset (forgot password)
   * NOTE: Backend API needs to be implemented
   */
  async forgotPassword(email: string): Promise<void> {
    const response = await apiClient.post("/auth/forgot-password", {
      email,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Failed to send password reset email");
    }
  }

  /**
   * Reset password with token
   * NOTE: Backend API needs to be implemented
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await apiClient.post("/auth/reset-password", {
      token,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.message || "Password reset failed");
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: {
    fullName?: string;
    phone?: string | null;
    avatarUrl?: string | null;
  }): Promise<UserResponse> {
    const response = await apiClient.put<UserResponse>("/users/profile", data);

    if (response.success && response.data) {
      // Update auth store with new profile data
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          name: response.data.fullName,
          phone: response.data.phone,
          avatar: response.data.avatarUrl,
        });
      }
      return response.data;
    }

    throw new Error(response.message || "Profile update failed");
  }

  /**
   * Get customer profile stats
   */
  async getCustomerStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    walletBalance: number;
    supportTickets: number;
  }> {
    const response = await apiClient.get<{
      totalOrders: number;
      pendingOrders: number;
      walletBalance: number;
      supportTickets: number;
    }>("/users/profile/stats");

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || "Failed to get customer stats");
  }

  /**
   * Map backend roleKey to frontend role
   */
  private mapRoleKeyToRole(roleKey: string): "customer" | "seller" | "moderator" | "admin" {
    const roleMap: Record<string, "customer" | "seller" | "moderator" | "admin"> = {
      CUSTOMER: "customer",
      SELLER: "seller",
      MODERATOR: "moderator",
      ADMIN: "admin",
    };
    
    return roleMap[roleKey] || "customer";
  }

  /**
   * Map trust level number to enum
   */
  private mapTrustLevel(level: number): "new" | "basic" | "trusted" | "verified" | "blacklisted" {
    if (level < 0) return "blacklisted";
    if (level === 0) return "new";
    if (level < 50) return "basic";
    if (level < 100) return "trusted";
    return "verified";
  }
}

export const authService = new AuthService();