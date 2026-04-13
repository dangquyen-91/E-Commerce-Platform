"use client";

import { useEffect, useLayoutEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { authService } from "@/lib/services/auth.service";
import { apiClient } from "@/lib/api";
import type { User } from "@/types";

// Use useLayoutEffect on client to run before paint
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Decode JWT payload (không verify, chỉ lấy payload).
 * BE access token: { userId, email, roleKey }.
 */
function decodeJwtPayload(token: string): { userId?: string; email?: string; roleKey?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { userId?: string; email?: string; roleKey?: string };
    return payload;
  } catch {
    return null;
  }
}

function mapRoleKey(roleKey: string): "customer" | "seller" | "moderator" | "admin" {
  const m: Record<string, "customer" | "seller" | "moderator" | "admin"> = {
    CUSTOMER: "customer",
    SELLER: "seller",
    MODERATOR: "moderator",
    ADMIN: "admin",
  };
  return m[roleKey] ?? "customer";
}

/**
 * Tạo user tối thiểu từ JWT khi getMe thất bại.
 * Giúp không bị redirect về /login khi chuyển trang (token vẫn hợp lệ).
 */
function minimalUserFromJwt(payload: { userId: string; email: string; roleKey?: string }): User {
  const now = new Date();
  return {
    id: payload.userId,
    roleId: payload.userId,
    email: payload.email,
    name: payload.email,
    role: mapRoleKey(payload.roleKey ?? "CUSTOMER"),
    emailVerified: false,
    trustLevel: "new",
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Auth Provider - Kiểm tra đăng nhập khi load app.
 * Sử dụng JWT decode để set user ngay lập tức (tránh flash),
 * sau đó gọi API để lấy thông tin đầy đủ.
 */
export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  // Synchronous initial check - runs before first paint to prevent flash
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const hasCookie = document.cookie.includes("accessToken=");

    if (token || hasCookie) {
      // Immediately set user from JWT to prevent flash
      const payload = token ? decodeJwtPayload(token) : null;
      if (payload?.userId && payload?.email) {
        const { user } = useAuthStore.getState();
        // Only set if not already set (prevent overwriting full user data)
        if (!user) {
          useAuthStore.getState().setUser(
            minimalUserFromJwt({ userId: payload.userId, email: payload.email, roleKey: payload.roleKey })
          );
        }
      }
    } else {
      useAuthStore.getState().setUser(null);
    }
  }, []);

  // Async check for full user data
  useEffect(() => {
    const checkAuth = async (retryCount = 0) => {
      try {
        await authService.getMe();
      } catch (error: unknown) {
        const err = error as { response?: { status?: number }; message?: string };
        // Kiểm tra cookie trước khi quyết định
        const hasCookie = typeof globalThis.window !== "undefined" &&
                         globalThis.document.cookie.includes("accessToken=");
        const hasLocalStorage = !!globalThis.localStorage?.getItem("accessToken");

        // Nếu không còn cookie và localStorage, clear auth state
        if (!hasCookie && !hasLocalStorage) {
          apiClient.clearToken();
          useAuthStore.getState().setUser(null);
          return;
        }

        // Nếu lỗi là 304 Not Modified và chưa retry, retry với timestamp mới
        const is304 = err?.response?.status === 304 ||
                     err?.message?.includes("304 Not Modified");

        if (is304 && retryCount < 2 && (hasCookie || hasLocalStorage)) {
          // Retry với timestamp mới để bypass cache
          setTimeout(() => {
            checkAuth(retryCount + 1);
          }, 100);
          return;
        }

        // Nếu đã retry hoặc không phải 304, giữ nguyên user từ JWT (đã set ở trên)
        // Không cần làm gì thêm vì user đã được set từ useLayoutEffect
      }
    };

    const hasToken =
      typeof globalThis.window !== "undefined" &&
      (globalThis.document.cookie.includes("accessToken=") ||
        !!globalThis.localStorage?.getItem("accessToken"));

    if (hasToken) {
      checkAuth();
    }

    // Kiểm tra cookie định kỳ để phát hiện khi cookie bị xóa
    const checkCookieInterval = setInterval(() => {
      if (typeof globalThis.window === "undefined") return;

      const hasCookie = globalThis.document.cookie.includes("accessToken=");
      const hasLocalStorage = !!globalThis.localStorage?.getItem("accessToken");
      const { isAuthenticated } = useAuthStore.getState();

      // Nếu đang authenticated nhưng không còn cookie và localStorage
      if (isAuthenticated && !hasCookie && !hasLocalStorage) {
        // Cookie đã bị xóa - đăng xuất ngay
        apiClient.clearToken();
        useAuthStore.getState().setUser(null);
      }
    }, 1000); // Kiểm tra mỗi giây

    return () => {
      clearInterval(checkCookieInterval);
    };
  }, []);

  return <>{children}</>;
}
