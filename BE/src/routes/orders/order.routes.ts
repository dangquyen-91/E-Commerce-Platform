import { Router } from "express";
import { orderController } from "@/controllers/orders/order.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Create order
router.post("/", orderController.createOrder);

// Get my orders (as customer)
router.get("/", orderController.getMyOrders);

// Get seller order items (history of sales)
router.get("/seller/items", orderController.getSellerOrderItems);

// Confirm delivery of an order item (customer confirms receipt)
router.post("/items/:itemId/confirm", orderController.confirmDelivery);

// Get order by order code (must be before /:orderId to avoid conflicts)
router.get("/code/:orderCode", orderController.getOrderByCode);

// Cancel order by buyer
router.post("/:orderId/cancel", orderController.cancelOrderByBuyer);

// Cancel order by seller
router.post("/:orderId/seller-cancel", orderController.cancelOrderBySeller);

// Get escrow status for an order
router.get("/:orderId/escrow-status", orderController.getEscrowStatus);

// Get order by ID (keep last to avoid conflicts with other routes)
router.get("/:orderId", orderController.getOrderById);

export default router;
