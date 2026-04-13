import { Request, Response } from "express";
import { Role } from "@/models";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSION_DEFINITIONS } from "@/constants/permissions";

export class RoleController {
  /**
   * Get all roles with their permissions
   * GET /api/roles
   */
  getAllRoles = wrapRequestHandler(async (_req: Request, res: Response) => {
    const roles = await Role.find({ status: "Active" }).select("-__v");
    
    // Enrich roles with permission details
    const rolesWithPermissions = roles.map((role) => {
      const permissionDetails = role.permissions.map((permissionKey) => {
        const definition = PERMISSION_DEFINITIONS.find(
          (def) => def.permissionKey === permissionKey
        );
        return {
          permissionKey,
          permissionName: definition?.permissionName || permissionKey,
          description: definition?.description || "",
          resource: definition?.resource || permissionKey.split(":")[0],
          action: definition?.action || permissionKey.split(":")[1] || "",
        };
      });

      // Group permissions by resource
      const permissionsByResource: Record<string, typeof permissionDetails> = {};
      permissionDetails.forEach((perm) => {
        if (!permissionsByResource[perm.resource]) {
          permissionsByResource[perm.resource] = [];
        }
        permissionsByResource[perm.resource].push(perm);
      });

      return {
        id: role._id,
        roleKey: role.roleKey,
        roleName: role.roleName,
        description: role.description,
        status: role.status,
        permissions: role.permissions,
        permissionsCount: role.permissions.length,
        permissionsByResource,
        permissionDetails,
        createdAt: role.createdAt,
      };
    });

    res.status(200).json({
      success: true,
      data: rolesWithPermissions,
    });
  });

  /**
   * Get a specific role with detailed permissions
   * GET /api/roles/:roleId
   */
  getRoleById = wrapRequestHandler(async (req: Request, res: Response) => {
    const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
    const role = await Role.findById(roleId).select("-__v");
    
    if (!role) {
      res.status(404).json({
        success: false,
        message: "Role not found",
      });
      return;
    }

    // Get permission details
    const permissionDetails = role.permissions.map((permissionKey) => {
      const definition = PERMISSION_DEFINITIONS.find(
        (def) => def.permissionKey === permissionKey
      );
      return {
        permissionKey,
        permissionName: definition?.permissionName || permissionKey,
        description: definition?.description || "",
        resource: definition?.resource || permissionKey.split(":")[0],
        action: definition?.action || permissionKey.split(":")[1] || "",
      };
    });

    // Group permissions by resource
    const permissionsByResource: Record<string, typeof permissionDetails> = {};
    permissionDetails.forEach((perm) => {
      if (!permissionsByResource[perm.resource]) {
        permissionsByResource[perm.resource] = [];
      }
      permissionsByResource[perm.resource].push(perm);
    });

    // Get all available permissions grouped by resource
    const allPermissionsByResource: Record<string, typeof PERMISSION_DEFINITIONS[number][]> = {};
    PERMISSION_DEFINITIONS.forEach((perm) => {
      if (!allPermissionsByResource[perm.resource]) {
        allPermissionsByResource[perm.resource] = [];
      }
      allPermissionsByResource[perm.resource].push(perm);
    });

    // Mark which permissions are assigned
    const allPermissionsWithStatus = PERMISSION_DEFINITIONS.map((perm) => ({
      ...perm,
      isAssigned: role.permissions.includes(perm.permissionKey),
    }));

    res.status(200).json({
      success: true,
      data: {
        role: {
          id: role._id,
          roleKey: role.roleKey,
          roleName: role.roleName,
          description: role.description,
          status: role.status,
          createdAt: role.createdAt,
        },
        permissions: role.permissions,
        permissionsCount: role.permissions.length,
        permissionsByResource,
        permissionDetails,
        allPermissionsByResource,
        allPermissionsWithStatus,
      },
    });
  });

  /**
   * Get role by roleKey with detailed permissions
   * GET /api/roles/key/:roleKey
   */
  getRoleByKey = wrapRequestHandler(async (req: Request, res: Response) => {
    const roleKey = Array.isArray(req.params.roleKey) ? req.params.roleKey[0] : req.params.roleKey;
    const role = await Role.findOne({ roleKey }).select("-__v");
    
    if (!role) {
      res.status(404).json({
        success: false,
        message: "Role not found",
      });
      return;
    }

    // Get permission details
    const permissionDetails = role.permissions.map((permissionKey) => {
      const definition = PERMISSION_DEFINITIONS.find(
        (def) => def.permissionKey === permissionKey
      );
      return {
        permissionKey,
        permissionName: definition?.permissionName || permissionKey,
        description: definition?.description || "",
        resource: definition?.resource || permissionKey.split(":")[0],
        action: definition?.action || permissionKey.split(":")[1] || "",
      };
    });

    // Group permissions by resource
    const permissionsByResource: Record<string, typeof permissionDetails> = {};
    permissionDetails.forEach((perm) => {
      if (!permissionsByResource[perm.resource]) {
        permissionsByResource[perm.resource] = [];
      }
      permissionsByResource[perm.resource].push(perm);
    });

    res.status(200).json({
      success: true,
      data: {
        role: {
          id: role._id,
          roleKey: role.roleKey,
          roleName: role.roleName,
          description: role.description,
          status: role.status,
          createdAt: role.createdAt,
        },
        permissions: role.permissions,
        permissionsCount: role.permissions.length,
        permissionsByResource,
        permissionDetails,
      },
    });
  });

  /**
   * Get all available resources (grouped permissions)
   * GET /api/roles/resources
   */
  getResources = wrapRequestHandler(async (_req: Request, res: Response) => {
    const resources: Record<string, typeof PERMISSION_DEFINITIONS[number][]> = {};
    
    PERMISSION_DEFINITIONS.forEach((perm) => {
      if (!resources[perm.resource]) {
        resources[perm.resource] = [];
      }
      resources[perm.resource].push(perm);
    });

    res.status(200).json({
      success: true,
      data: resources,
    });
  });
}
