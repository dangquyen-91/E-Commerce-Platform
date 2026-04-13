import { Router } from "express";
import { InventoryController } from "@/controllers/inventory/inventory.controller";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();
const inventoryController = new InventoryController();

// Public route - Get available count for a product (no auth required)
router.get(
  "/product/:productId/count",
  wrapRequestHandler(inventoryController.getAvailableCount)
);

// All other routes require authentication
router.use(authenticate);

// Get inventory stats (place before /:itemId to avoid conflict)
router.get(
  "/stats",
  checkPermission(PERMISSIONS.INVENTORY_VIEW),
  wrapRequestHandler(inventoryController.getInventoryStats)
);

// Get my inventory items
router.get(
  "/",
  checkPermission(PERMISSIONS.INVENTORY_VIEW),
  wrapRequestHandler(inventoryController.getMyInventory)
);

// Add single inventory item
router.post(
  "/",
  checkPermission(PERMISSIONS.INVENTORY_ADD),
  wrapRequestHandler(inventoryController.addInventoryItem)
);

// Add bulk inventory items
router.post(
  "/bulk",
  checkPermission(PERMISSIONS.INVENTORY_ADD),
  wrapRequestHandler(inventoryController.addBulkInventory)
);

// Update inventory item
router.put(
  "/:itemId",
  checkPermission(PERMISSIONS.INVENTORY_UPDATE),
  wrapRequestHandler(inventoryController.updateInventoryItem)
);

// Delete inventory item
router.delete(
  "/:itemId",
  checkPermission(PERMISSIONS.INVENTORY_DELETE),
  wrapRequestHandler(inventoryController.deleteInventoryItem)
);

export default router;
