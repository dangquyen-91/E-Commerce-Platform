import { Role } from "@/models";
import { PERMISSIONS, PERMISSION_DEFINITIONS, ROLE_PERMISSIONS } from "@/constants/permissions";
import { ROLE_KEYS } from "@/constants/roles";

/**
 * Service for managing permissions in Role model
 */
export class PermissionService {
  /**
   * Assign default permissions to roles
   * Should be called after roles are created
   * Optimized to only update if permissions are different
   */
  static async assignDefaultPermissions(): Promise<void> {
    try {
      for (const [roleKey, permissionKeys] of Object.entries(ROLE_PERMISSIONS)) {
        const role = await Role.findOne({ roleKey });
        if (!role) {
          continue;
        }

        // Check if permissions are already correct (same length and same values)
        const currentPermissions = new Set(role.permissions || []);
        const expectedPermissions = new Set(permissionKeys);

        const isDifferent =
          currentPermissions.size !== expectedPermissions.size ||
          [...expectedPermissions].some(p => !currentPermissions.has(p));

        // Only update if permissions are different
        if (isDifferent) {
          role.permissions = [...permissionKeys];
          await role.save();
          console.log(`Updated permissions for role: ${roleKey}`);
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all available permissions (from constants)
   */
  static getAllPermissions() {
    return PERMISSION_DEFINITIONS;
  }

  /**
   * Get permissions for a specific role
   */
  static async getRolePermissions(roleId: string) {
    const role = await Role.findById(roleId);
    if (!role) {
      return null;
    }

    return {
      role: {
        id: role._id,
        roleKey: role.roleKey,
        roleName: role.roleName,
      },
      permissions: role.permissions || [],
    };
  }

  /**
   * Get permissions by role key
   */
  static async getPermissionsByRoleKey(roleKey: string): Promise<string[]> {
    const role = await Role.findOne({ roleKey });
    if (!role) {
      return [];
    }

    if (roleKey === ROLE_KEYS.ADMIN) {
      // Admin has all permissions
      return Object.values(PERMISSIONS);
    }

    return role.permissions || [];
  }

  /**
   * Assign permission to role
   */
  static async assignPermissionToRole(
    roleId: string,
    permissionKey: string
  ): Promise<void> {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Validate permission key exists in constants
    if (!Object.values(PERMISSIONS).includes(permissionKey as any)) {
      throw new Error("Invalid permission key");
    }

    // Add permission if not already present
    if (!role.permissions.includes(permissionKey)) {
      role.permissions.push(permissionKey);
      await role.save();
    }
  }

  /**
   * Revoke permission from role
   */
  static async revokePermissionFromRole(
    roleId: string,
    permissionKey: string
  ): Promise<void> {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Remove permission if present
    role.permissions = role.permissions.filter((p) => p !== permissionKey);
    await role.save();
  }

  /**
   * Check if role has permission
   */
  static async roleHasPermission(
    roleId: string,
    permissionKey: string
  ): Promise<boolean> {
    const role = await Role.findById(roleId);
    if (!role) {
      return false;
    }

    if (role.roleKey === ROLE_KEYS.ADMIN) {
      return true;
    }

    return role.permissions.includes(permissionKey);
  }

  /**
   * Get all permissions grouped by resource
   */
  static getPermissionsByResource() {
    const grouped: Record<string, any[]> = {};

    for (const permissionDef of PERMISSION_DEFINITIONS) {
      if (!grouped[permissionDef.resource]) {
        grouped[permissionDef.resource] = [];
      }
      grouped[permissionDef.resource].push(permissionDef);
    }

    return grouped;
  }

  /**
   * Update role permissions (replace all)
   */
  static async updateRolePermissions(
    roleId: string,
    permissions: string[]
  ): Promise<void> {
    const role = await Role.findById(roleId);
    if (!role) {
      throw new Error("Role not found");
    }

    // Validate all permission keys
    const validPermissions = Object.values(PERMISSIONS) as string[];
    for (const permission of permissions) {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Invalid permission key: ${permission}`);
      }
    }

    role.permissions = permissions;
    await role.save();
  }
}
