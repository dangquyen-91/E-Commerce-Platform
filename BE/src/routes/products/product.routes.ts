import { Router } from "express";
import { ProductController } from "@/controllers/products/product.controller";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();
const productController = new ProductController();

// Public routes (Guest can access)
router.get("/", wrapRequestHandler(productController.getProducts));
router.get("/featured", wrapRequestHandler(productController.getFeaturedProducts));
router.get("/top", wrapRequestHandler(productController.getTopProducts));
router.get("/:productId", wrapRequestHandler(productController.getProductById));

// Protected routes (require authentication)
router.use(authenticate);

// Seller routes - Create and manage products
router.post(
  "/",
  checkPermission(PERMISSIONS.PRODUCT_CREATE),
  wrapRequestHandler(productController.createProduct)
);

router.get(
  "/shop/:shopId",
  checkPermission(PERMISSIONS.PRODUCT_VIEW_OWN),
  wrapRequestHandler(productController.getMyProducts)
);

router.get(
  "/me/:productId",
  checkPermission(PERMISSIONS.PRODUCT_VIEW_OWN),
  wrapRequestHandler(productController.getMyProductById)
);

router.put(
  "/:productId",
  checkPermission(PERMISSIONS.PRODUCT_UPDATE),
  wrapRequestHandler(productController.updateProduct)
);

router.delete(
  "/:productId",
  checkPermission(PERMISSIONS.PRODUCT_DELETE),
  wrapRequestHandler(productController.deleteProduct)
);


export default router;
