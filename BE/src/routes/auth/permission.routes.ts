import { Router } from "express";
import { PermissionController } from "@/controllers/auth/permission.controller";
import { authenticate, authorize, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";
import { ROLE_KEYS } from "@/constants/roles";

const router = Router();
const permissionController = new PermissionController();

// All routes require authentication
router.use(authenticate);

// Admin-only routes
router.post(
  "/assign-defaults",
  authorize(ROLE_KEYS.ADMIN),
  wrapRequestHandler(permissionController.assignDefaults)
);

router.get(
  "/",
  checkPermission(PERMISSIONS.PERMISSION_VIEW),
  wrapRequestHandler(permissionController.getAllPermissions)
);

router.get(
  "/by-resource",
  checkPermission(PERMISSIONS.PERMISSION_VIEW),
  wrapRequestHandler(permissionController.getPermissionsByResource)
);

router.get(
  "/role/:roleId",
  checkPermission(PERMISSIONS.PERMISSION_VIEW),
  wrapRequestHandler(permissionController.getRolePermissions)
);

router.get(
  "/role-key/:roleKey",
  checkPermission(PERMISSIONS.PERMISSION_VIEW),
  wrapRequestHandler(permissionController.getPermissionsByRoleKey)
);

router.get(
  "/me",
  wrapRequestHandler(permissionController.getMyPermissions)
);

router.post(
  "/assign",
  checkPermission(PERMISSIONS.PERMISSION_ASSIGN),
  wrapRequestHandler(permissionController.assignPermission)
);

router.delete(
  "/revoke",
  checkPermission(PERMISSIONS.PERMISSION_REVOKE),
  wrapRequestHandler(permissionController.revokePermission)
);

router.put(
  "/role/:roleId",
  checkPermission(PERMISSIONS.PERMISSION_ASSIGN),
  wrapRequestHandler(permissionController.updateRolePermissions)
);

export default router;
