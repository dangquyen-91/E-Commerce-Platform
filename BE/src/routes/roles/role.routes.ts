import { Router } from "express";
import { RoleController } from "@/controllers/auth/role.controller";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();
const roleController = new RoleController();

// All routes require authentication
router.use(authenticate);

// Get all roles with permissions (Admin only)
router.get(
  "/",
  checkPermission(PERMISSIONS.ROLE_VIEW),
  wrapRequestHandler(roleController.getAllRoles)
);

// Get role by ID with detailed permissions
router.get(
  "/:roleId",
  checkPermission(PERMISSIONS.ROLE_VIEW),
  wrapRequestHandler(roleController.getRoleById)
);

// Get role by roleKey with detailed permissions
router.get(
  "/key/:roleKey",
  checkPermission(PERMISSIONS.ROLE_VIEW),
  wrapRequestHandler(roleController.getRoleByKey)
);

// Get all resources (grouped permissions)
router.get(
  "/resources/list",
  checkPermission(PERMISSIONS.PERMISSION_VIEW),
  wrapRequestHandler(roleController.getResources)
);

export default router;
