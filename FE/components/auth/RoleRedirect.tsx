"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth";

interface RoleRedirectProps {
  children: React.ReactNode;
  publicRoutes?: string[];
}

/**
 * Component to redirect authenticated users to their role-specific dashboard
 * when they visit public routes like home page
 */
export function RoleRedirect({ children, publicRoutes = [] }: RoleRedirectProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Don't redirect if still loading or not authenticated
    if (isLoading || !isAuthenticated || !user) {
      return;
    }

    // Don't redirect if on a public route that should be accessible
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route));
      
      // Also allow access to role-specific routes
      const roleRoutes = {
        admin: ["/admin"],
        moderator: ["/moderator"],
        seller: ["/seller"],
        customer: ["/customer"],
      };
      
      const isRoleRoute = roleRoutes[user.role as keyof typeof roleRoutes]?.some((route) =>
        currentPath.startsWith(route)
      );

      // Allow access to public routes, role routes, products, categories, auth pages
      if (
        isPublicRoute || 
        isRoleRoute || 
        currentPath.startsWith("/products") || 
        currentPath.startsWith("/categories") ||
        currentPath.startsWith("/login") ||
        currentPath.startsWith("/register") ||
        currentPath.startsWith("/sellers")
      ) {
        return;
      }

      // Redirect to role-specific dashboard (except customer - stays on home)
      const dashboardRoutes = {
        admin: "/admin",
        moderator: "/moderator",
        seller: "/seller",
        // customer: "/customer", // Customer stays on home page
      };

      const dashboardRoute = dashboardRoutes[user.role as keyof typeof dashboardRoutes];
      if (dashboardRoute && currentPath === "/") {
        router.replace(dashboardRoute);
      }
    }
  }, [user, isAuthenticated, isLoading, router, publicRoutes]);

  return <>{children}</>;
}
