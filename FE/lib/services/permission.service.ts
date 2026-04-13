/**
 * Permission Service
 * Handles permission management API calls
 */

import { apiClient } from "../api";

export interface Permission {
  _id: string;
  permissionKey: string;
  permissionName: string;
  description?: string | null;
  resource: string;
  action: string;
  createdAt: string;
}

export interface Role {
  id: string;
  roleKey: string;
  roleName: string;
  description?: string | null;
  status: string;
  permissions: string[];
  createdAt: string;
}

export interface RolePermissionResponse {
  role: {
    id: string;
    roleKey: string;
    roleName: string;
  };
  permissions: string[];
}

export interface AssignPermissionRequest {
  roleId: string;
  permissionKey: string;
}

export interface RevokePermissionRequest {
  roleId: string;
  permissionKey: string;
}

export interface UpdateRolePermissionsRequest {
  permissions: string[];
}

class PermissionService {
  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const response = await apiClient.get<Permission[]>("/permissions");
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get permissions");
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsByResource(): Promise<Record<string, Permission[]>> {
    const response = await apiClient.get<Record<string, Permission[]>>("/permissions/by-resource");
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get permissions by resource");
  }

  /**
   * Get permissions for a specific role
   */
  async getRolePermissions(roleId: string): Promise<RolePermissionResponse> {
    const response = await apiClient.get<RolePermissionResponse>(`/permissions/role/${roleId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get role permissions");
  }

  /**
   * Get permissions by role key
   */
  async getPermissionsByRoleKey(roleKey: string): Promise<string[]> {
    const response = await apiClient.get<string[]>(`/permissions/role-key/${roleKey}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get permissions by role key");
  }

  /**
   * Get current user's permissions
   */
  async getMyPermissions(): Promise<string[]> {
    const response = await apiClient.get<string[]>("/permissions/me");
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get user permissions");
  }

  /**
   * Assign default permissions to roles (Admin only)
   */
  async assignDefaultPermissions(): Promise<void> {
    const response = await apiClient.post("/permissions/assign-defaults", {});
    
    if (!response.success) {
      throw new Error(response.message || "Failed to assign default permissions");
    }
  }

  /**
   * Assign permission to role (Admin only)
   */
  async assignPermissionToRole(data: AssignPermissionRequest): Promise<void> {
    const response = await apiClient.post("/permissions/assign", data);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to assign permission");
    }
  }

  /**
   * Revoke permission from role (Admin only)
   */
  async revokePermissionFromRole(data: RevokePermissionRequest): Promise<void> {
    const response = await apiClient.delete("/permissions/revoke", {
      data,
    });
    
    if (!response.success) {
      throw new Error(response.message || "Failed to revoke permission");
    }
  }

  /**
   * Update role permissions (replace all) (Admin only)
   */
  async updateRolePermissions(roleId: string, data: UpdateRolePermissionsRequest): Promise<void> {
    const response = await apiClient.put(`/permissions/role/${roleId}`, data);
    
    if (!response.success) {
      throw new Error(response.message || "Failed to update role permissions");
    }
  }
}

export const permissionService = new PermissionService();
