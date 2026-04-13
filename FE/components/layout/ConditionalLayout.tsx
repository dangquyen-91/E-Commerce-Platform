"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

/**
 * Conditionally render Header and Footer based on current route
 * Admin routes should not show the global Header/Footer
 */
export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Don't show global Header/Footer for admin and moderator routes
  const isAdminRoute = pathname?.startsWith("/admin");
  const isModeratorRoute = pathname?.startsWith("/moderator");
  
  if (isAdminRoute || isModeratorRoute) {
    // Admin and Moderator routes have their own layout, just render children
    return <>{children}</>;
  }
  
  // For other routes, show Header and Footer
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 w-full">{children}</main>
      <Footer />
    </div>
  );
}
