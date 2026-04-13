/**
 * Hook to manage user permissions
 */

import { useState, useEffect } from "react";
import { permissionService } from "@/lib/services/permission.service";
import { useAuthStore } from "@/lib/auth";
import { toast } from "sonner";

export function usePermissions() {
  const { user } = useAuthStore();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPermissions();
    } else {
      setPermissions([]);
      setIsLoading(false);
    }
  }, [user]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      const userPermissions = await permissionService.getMyPermissions();
      setPermissions(userPermissions);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      toast.error("Không thể tải quyền hạn");
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === "admin") return true;
    
    return permissions.includes(permissionKey);
  };

  /**
   * Check if user has any of the specified permissions
   */
  const hasAnyPermission = (permissionKeys: string[]): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === "admin") return true;
    
    return permissionKeys.some((key) => permissions.includes(key));
  };

  /**
   * Check if user has all of the specified permissions
   */
  const hasAllPermissions = (permissionKeys: string[]): boolean => {
    if (!user) return false;
    
    // Admin has all permissions
    if (user.role === "admin") return true;
    
    return permissionKeys.every((key) => permissions.includes(key));
  };

  return {
    permissions,
    isLoading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refresh: loadPermissions,
  };
}
