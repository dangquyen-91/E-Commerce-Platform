import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { User, Role } from "@/models";
import { MESSAGES } from "@/constants/messages";
import { ROLE_KEYS, ROLE_STATUS, USER_STATUS } from "@/constants/roles";

/**
 * Middleware to check if user has required permission(s)
 * Usage: checkPermission("product:create") or checkPermission(["product:create", "product:update"])
 */
export const checkPermission = (...requiredPermissions: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: MESSAGES.ERROR.AUTH.UNAUTHORIZED,
        });
        return;
      }

      // Admin has all permissions
      if (req.user.roleKey === ROLE_KEYS.ADMIN) {
        next();
        return;
      }

      // Get user's role with permissions
      const role = await Role.findById(req.user.roleId);
      if (!role || role.status !== ROLE_STATUS.ACTIVE) {
        res.status(403).json({
          success: false,
          message: MESSAGES.ERROR.AUTH.FORBIDDEN,
        });
        return;
      }

      // Get permissions from role
      const userPermissions = new Set(role.permissions || []);

      // Check if user has at least one of the required permissions
      const hasPermission = requiredPermissions.some((permission) =>
        userPermissions.has(permission)
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: MESSAGES.ERROR.AUTH.FORBIDDEN,
          requiredPermissions,
        });
        return;
      }

      next();
    } catch (error) {
      // Permission check error
      res.status(500).json({
        success: false,
        message: MESSAGES.ERROR.GENERAL.INTERNAL_SERVER_ERROR,
      });
    }
  };
};

/**
 * Middleware to check if user has ALL required permissions
 * Usage: checkAllPermissions("product:create", "product:update")
 */
export const checkAllPermissions = (...requiredPermissions: string[]) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: MESSAGES.ERROR.AUTH.UNAUTHORIZED,
        });
        return;
      }

      // Admin has all permissions
      if (req.user.roleKey === ROLE_KEYS.ADMIN) {
        next();
        return;
      }

      // Get user's role with permissions
      const role = await Role.findById(req.user.roleId);
      if (!role || role.status !== ROLE_STATUS.ACTIVE) {
        res.status(403).json({
          success: false,
          message: MESSAGES.ERROR.AUTH.FORBIDDEN,
        });
        return;
      }

      // Get permissions from role
      const userPermissions = new Set(role.permissions || []);

      // Check if user has ALL required permissions
      const hasAllPermissions = requiredPermissions.every((permission) =>
        userPermissions.has(permission)
      );

      if (!hasAllPermissions) {
        res.status(403).json({
          success: false,
          message: MESSAGES.ERROR.AUTH.FORBIDDEN,
          requiredPermissions,
        });
        return;
      }

      next();
    } catch (error) {
      // Permission check error
      res.status(500).json({
        success: false,
        message: MESSAGES.ERROR.GENERAL.INTERNAL_SERVER_ERROR,
      });
    }
  };
};

/**
 * Helper function to check if user has permission (for use in controllers/services)
 */
export const hasPermission = async (
  userId: string,
  requiredPermission: string
): Promise<boolean> => {
  try {
    const user = await User.findById(userId).populate("roleId");
    if (!user || user.isDeleted || user.status !== USER_STATUS.ACTIVE) {
      return false;
    }

    const role = user.roleId;
    if (typeof role === "object" && role !== null && "roleKey" in role) {
      const roleDoc = role as any;
      if (roleDoc.roleKey === ROLE_KEYS.ADMIN) {
        return true;
      }
      // Get permissions from populated role
      const userPermissions = new Set(roleDoc.permissions || []);
      return userPermissions.has(requiredPermission);
    }

    // If role is not populated, fetch it
    const roleDoc = await Role.findById(user.roleId);
    if (!roleDoc || roleDoc.status !== "Active") {
      return false;
    }

    if (roleDoc.roleKey === ROLE_KEYS.ADMIN) {
      return true;
    }

    const userPermissions = new Set(roleDoc.permissions || []);
    return userPermissions.has(requiredPermission);
  } catch (error) {
    // Permission check error
    return false;
  }
};

/**
 * Helper function to get all permissions for a user
 */
export const getUserPermissions = async (
  userId: string
): Promise<string[]> => {
  try {
    const user = await User.findById(userId).populate("roleId");
    if (!user || user.isDeleted || user.status !== USER_STATUS.ACTIVE) {
      return [];
    }

    const role = user.roleId;
    if (typeof role === "object" && role !== null && "roleKey" in role) {
      const roleDoc = role as any;
      if (roleDoc.roleKey === "ADMIN") {
        // Admin has all permissions - return all from constants
        const { PERMISSIONS } = await import("@/constants/permissions");
        return Object.values(PERMISSIONS);
      }
      // Return permissions from populated role
      return roleDoc.permissions || [];
    }

    // If role is not populated, fetch it
    const roleDoc = await Role.findById(user.roleId);
    if (!roleDoc || roleDoc.status !== "Active") {
      return [];
    }

    if (roleDoc.roleKey === "ADMIN") {
      // Admin has all permissions
      const { PERMISSIONS } = await import("@/constants/permissions");
      return Object.values(PERMISSIONS);
    }

    return roleDoc.permissions || [];
  } catch (error) {
    // Get user permissions error
    return [];
  }
};
