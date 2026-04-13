import { Router } from "express";
import { UserController } from "@/controllers/users/user.controller";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

// Customer routes - View and update own profile
router.get(
  "/profile",
  checkPermission(PERMISSIONS.PROFILE_VIEW),
  wrapRequestHandler(userController.getProfile)
);

router.put(
  "/profile",
  checkPermission(PERMISSIONS.PROFILE_UPDATE),
  wrapRequestHandler(userController.updateProfile)
);

// Customer profile stats (dashboard menu)
router.get(
  "/profile/stats",
  checkPermission(PERMISSIONS.PROFILE_VIEW),
  wrapRequestHandler(userController.getCustomerStats)
);

// Admin routes - View any user
router.get(
  "/:userId",
  checkPermission(PERMISSIONS.USER_VIEW),
  wrapRequestHandler(userController.getUserById)
);

export default router;
