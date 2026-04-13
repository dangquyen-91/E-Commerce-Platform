import { Request, Response } from "express";
import { PermissionService } from "@/services";
import { wrapRequestHandler } from "@/utils/handlers";
import { AuthRequest } from "@/middleware";

export class PermissionController {

  /**
   * Assign default permissions to roles (Admin only)
   * POST /api/permissions/assign-defaults
   */
  assignDefaults = wrapRequestHandler(async (_req: Request, res: Response) => {
    await PermissionService.assignDefaultPermissions();
    res.status(200).json({
      success: true,
      message: "Default permissions assigned to roles successfully",
    });
  });

  /**
   * Get all permissions (Admin only)
   * GET /api/permissions
   */
  getAllPermissions = wrapRequestHandler(
    async (_req: Request, res: Response) => {
      const permissions = await PermissionService.getAllPermissions();
      res.status(200).json({
        success: true,
        data: permissions,
      });
    }
  );

  /**
   * Get permissions by resource
   * GET /api/permissions/by-resource
   */
  getPermissionsByResource = wrapRequestHandler(
    async (_req: Request, res: Response) => {
      const grouped = await PermissionService.getPermissionsByResource();
      res.status(200).json({
        success: true,
        data: grouped,
      });
    }
  );

  /**
   * Get permissions for a role
   * GET /api/permissions/role/:roleId
   */
  getRolePermissions = wrapRequestHandler(
    async (req: Request, res: Response) => {
      const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
      const rolePermissions = await PermissionService.getRolePermissions(roleId);
      res.status(200).json({
        success: true,
        data: rolePermissions,
      });
    }
  );

  /**
   * Get permissions by role key
   * GET /api/permissions/role-key/:roleKey
   */
  getPermissionsByRoleKey = wrapRequestHandler(
    async (req: Request, res: Response) => {
      const roleKey = Array.isArray(req.params.roleKey) ? req.params.roleKey[0] : req.params.roleKey;
      const permissions = await PermissionService.getPermissionsByRoleKey(
        roleKey
      );
      res.status(200).json({
        success: true,
        data: permissions,
      });
    }
  );

  /**
   * Get current user's permissions
   * GET /api/permissions/me
   */
  getMyPermissions = wrapRequestHandler(
    async (req: AuthRequest, res: Response) => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
        return;
      }

      const { getUserPermissions } = await import("@/middleware/permission");
      const permissions = await getUserPermissions(req.user.id);
      res.status(200).json({
        success: true,
        data: permissions,
      });
    }
  );

  /**
   * Assign permission to role (Admin only)
   * POST /api/permissions/assign
   */
  assignPermission = wrapRequestHandler(
    async (req: Request, res: Response) => {
      const { roleId, permissionKey } = req.body;
      if (!roleId || !permissionKey) {
        res.status(400).json({
          success: false,
          message: "roleId and permissionKey are required",
        });
        return;
      }

      await PermissionService.assignPermissionToRole(roleId, permissionKey);
      res.status(200).json({
        success: true,
        message: "Permission assigned to role successfully",
      });
    }
  );

  /**
   * Revoke permission from role (Admin only)
   * DELETE /api/permissions/revoke
   */
  revokePermission = wrapRequestHandler(
    async (req: Request, res: Response) => {
      const { roleId, permissionKey } = req.body;
      if (!roleId || !permissionKey) {
        res.status(400).json({
          success: false,
          message: "roleId and permissionKey are required",
        });
        return;
      }

      await PermissionService.revokePermissionFromRole(roleId, permissionKey);
      res.status(200).json({
        success: true,
        message: "Permission revoked from role successfully",
      });
    }
  );

  /**
   * Update role permissions (replace all) (Admin only)
   * PUT /api/permissions/role/:roleId
   */
  updateRolePermissions = wrapRequestHandler(
    async (req: Request, res: Response) => {
      const roleId = Array.isArray(req.params.roleId) ? req.params.roleId[0] : req.params.roleId;
      const { permissions } = req.body;
      if (!permissions || !Array.isArray(permissions)) {
        res.status(400).json({
          success: false,
          message: "permissions array is required",
        });
        return;
      }

      await PermissionService.updateRolePermissions(roleId, permissions);
      res.status(200).json({
        success: true,
        message: "Role permissions updated successfully",
      });
    }
  );
}
