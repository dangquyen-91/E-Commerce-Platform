import { Router } from "express";
import { platformCatalogController } from "@/controllers/products/platform-catalog.controller";
import { authenticate, authorize } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { ROLE_KEYS } from "@/constants/roles";

const router = Router();

// Public routes
router.get("/", wrapRequestHandler(platformCatalogController.getAll));
router.get("/:id", wrapRequestHandler(platformCatalogController.getById));

// Protected routes
router.use(authenticate);

// Create platform catalog (admin only)
router.post(
  "/",
  authorize(ROLE_KEYS.ADMIN),
  wrapRequestHandler(platformCatalogController.create)
);

// Update platform catalog (admin only)
router.put(
  "/:id",
  authorize(ROLE_KEYS.ADMIN),
  wrapRequestHandler(platformCatalogController.update)
);

// Delete platform catalog (admin only)
router.delete(
  "/:id",
  authorize(ROLE_KEYS.ADMIN),
  wrapRequestHandler(platformCatalogController.delete)
);

export default router;
