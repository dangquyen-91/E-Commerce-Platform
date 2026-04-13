import { Router } from "express";
import { ShopController } from "@/controllers/shops/shop.controller";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();
const shopController = new ShopController();

// Seller routes - require authentication
router.post(
  "/",
  authenticate,
  checkPermission(PERMISSIONS.SHOP_CREATE),
  wrapRequestHandler(shopController.createShop)
);

router.get(
  "/me/my-shop",
  authenticate,
  checkPermission(PERMISSIONS.SHOP_VIEW_OWN),
  wrapRequestHandler(shopController.getMyShop)
);

// Seller dashboard stats
router.get(
  "/me/stats",
  authenticate,
  checkPermission(PERMISSIONS.SHOP_ANALYTICS_VIEW),
  wrapRequestHandler(shopController.getMyShopStats)
);

// Moderator routes - Approve/reject shop applications
// NOTE: Must be defined BEFORE /:shopId to avoid wildcard matching
router.get(
  "/applications/pending",
  authenticate,
  checkPermission(PERMISSIONS.SELLER_VIEW_APPLICATIONS),
  wrapRequestHandler(shopController.getPendingShops)
);

router.patch(
  "/:shopId/approve",
  authenticate,
  checkPermission(PERMISSIONS.SELLER_APPROVE),
  wrapRequestHandler(shopController.approveShop)
);

router.patch(
  "/:shopId/reject",
  authenticate,
  checkPermission(PERMISSIONS.SELLER_REJECT),
  wrapRequestHandler(shopController.rejectShop)
);

router.put(
  "/:shopId",
  authenticate,
  checkPermission(PERMISSIONS.SHOP_UPDATE),
  wrapRequestHandler(shopController.updateShop)
);

// Public route - get shop by ID (must be LAST to avoid matching other routes)
router.get("/:shopId", wrapRequestHandler(shopController.getShopById));

export default router;
