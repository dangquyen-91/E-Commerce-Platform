"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/lib/hooks/usePermissions";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RequirePermissionProps {
  children: ReactNode;
  permission: string | string[];
  requireAll?: boolean; // If true, requires all permissions; if false, requires any
  fallback?: ReactNode;
  showError?: boolean;
}

/**
 * Component that renders children only if user has required permission(s)
 */
export function RequirePermission({
  children,
  permission,
  requireAll = false,
  fallback,
  showError = true,
}: RequirePermissionProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } =
    usePermissions();

  if (isLoading) {
    return null; // Or return a loading spinner
  }

  const hasAccess = Array.isArray(permission)
    ? requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission)
    : hasPermission(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showError) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          Không có quyền truy cập
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground mb-4">
          Bạn không có quyền để truy cập tính năng này.
        </p>
        <Button asChild>
          <Link href="/">Về trang chủ</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
