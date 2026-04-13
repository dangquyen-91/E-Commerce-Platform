"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

interface RequireAuthProps {
  readonly children: React.ReactNode;
  readonly requiredRole?: "customer" | "seller" | "moderator" | "admin";
  readonly redirectTo?: string;
}

export function RequireAuth({
  children,
  requiredRole,
  redirectTo,
}: RequireAuthProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check token immediately (client-side only)
    if (globalThis.window === undefined) return;

    // First check if we have token in cookie or localStorage
    const hasCookie = globalThis.document.cookie.includes("accessToken=");
    const hasLocalStorage = globalThis.localStorage.getItem("accessToken") !== null;
    const hasToken = hasCookie || hasLocalStorage;

    // Nếu đang authenticated nhưng không còn cookie và localStorage, clear auth state
    if (isAuthenticated && !hasCookie && !hasLocalStorage) {
      useAuthStore.getState().logout();
      const currentPath = globalThis.window.location.pathname;
      router.replace(redirectTo || `/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // If no token at all, redirect immediately without waiting
    if (!hasToken) {
      const currentPath = globalThis.window.location.pathname;
      router.replace(redirectTo || `/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // Nếu có token nhưng chưa isAuthenticated: có thể AuthProvider đang getMe. Đợi thêm, không redirect khi còn isLoading.
    if (isLoading || !isAuthenticated) {
      const timer = setTimeout(() => {
        const state = useAuthStore.getState();
        const stillNotAuth = !state.isAuthenticated;
        const stillLoading = state.isLoading;
        
        // Kiểm tra lại cookie trước khi redirect
        const stillHasCookie = globalThis.document.cookie.includes("accessToken=");
        const stillHasLocalStorage = !!globalThis.localStorage.getItem("accessToken");
        
        // Chỉ redirect khi đã hết loading mà vẫn chưa đăng nhập và không còn token (tránh cắt getMe đang chạy)
        if (stillNotAuth && !stillLoading && !stillHasCookie && !stillHasLocalStorage) {
          const currentPath = globalThis.window.location.pathname;
          router.replace(redirectTo || `/login?redirect=${encodeURIComponent(currentPath)}`);
        }
      }, 400);
      return () => clearTimeout(timer);
    }

    // If authenticated but wrong role, redirect
    if (isAuthenticated && requiredRole && user?.role !== requiredRole) {
      switch (user?.role) {
        case "seller":
          router.replace("/seller");
          break;
        case "moderator":
        case "admin":
          router.replace("/moderator");
          break;
        default:
          router.replace("/customer");
          break;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo]);

  // If still loading, show nothing (will redirect if no auth)
  if (isLoading) {
    return null;
  }

  // Don't render anything if not authenticated or wrong role
  if (isAuthenticated && (!requiredRole || user?.role === requiredRole)) {
    return <>{children}</>;
  }

  return null;
}
