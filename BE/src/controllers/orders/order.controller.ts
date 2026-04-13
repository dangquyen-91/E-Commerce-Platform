import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { orderService } from "@/services/orders/order.service";
import { AppError } from "@/middleware/errorHandler";
import { z } from "zod";

// Validation schemas
const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product ID is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
  paymentMethod: z.enum(["Wallet", "Momo", "Vnpay", "Zalopay"]).default("Wallet"),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(1, "Lý do hủy đơn là bắt buộc").max(500, "Lý do quá dài"),
});

export class OrderController {
  /**
   * Create a new order
   * POST /orders
   */
  createOrder = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;

      // Validate input
      const validatedData = createOrderSchema.parse(req.body);

      // Create order
      const result = await orderService.createOrder(userId, {
        items: validatedData.items,
        paymentMethod: validatedData.paymentMethod,
      });

      res.status(201).json({
        success: true,
        message: "Đặt hàng thành công",
        data: {
          order: {
            _id: result.order._id,
            orderCode: result.order.orderCode,
            totalAmount: result.order.totalAmount,
            feeAmount: result.order.feeAmount,
            payableAmount: result.order.payableAmount,
            status: result.order.status,
            paymentProvider: result.order.paymentProvider,
            paidAt: result.order.paidAt,
            createdAt: result.order.createdAt,
          },
          items: result.orderItems.map((item) => ({
            _id: item._id,
            productId: item.productId,
            shopId: item.shopId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            itemStatus: item.itemStatus,
          })),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  };

  /**
   * Get order by ID
   * GET /orders/:orderId
   */
  getOrderById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
      const userId = req.user!.id;

      const result = await orderService.getOrderById(orderIdStr);

      if (!result) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      // Check ownership
      if (result.order.customerUserId.toString() !== userId) {
        throw new AppError("Bạn không có quyền xem đơn hàng này", 403);
      }

      res.status(200).json({
        success: true,
        data: {
          order: result.order,
          items: result.items,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get order by order code
   * GET /orders/code/:orderCode
   */
  getOrderByCode = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderCode } = req.params;
      const orderCodeStr = Array.isArray(orderCode) ? orderCode[0] : orderCode;
      const userId = req.user!.id;

      const result = await orderService.getOrderByCode(orderCodeStr);

      if (!result) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      // Check ownership - handle both populated and non-populated customerUserId
      const orderCustomerId = result.order.customerUserId?._id?.toString() || result.order.customerUserId?.toString();

      if (orderCustomerId !== userId) {
        throw new AppError("Bạn không có quyền xem đơn hàng này", 403);
      }

      res.status(200).json({
        success: true,
        data: {
          order: result.order,
          items: result.items,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get my orders
   * GET /orders
   */
  getMyOrders = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { limit, skip, status } = req.query;

      const orders = await orderService.getOrdersByCustomer(userId, {
        limit: limit ? parseInt(limit as string) : undefined,
        skip: skip ? parseInt(skip as string) : undefined,
        status: status as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get order items for current seller
   * GET /orders/seller/items
   */
  getSellerOrderItems = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { limit, skip, status } = req.query;

      const result = await orderService.getOrderItemsBySeller(userId, {
        limit: limit ? parseInt(limit as string, 10) : undefined,
        skip: skip ? parseInt(skip as string, 10) : undefined,
        status: status as string | undefined,
      });

      res.status(200).json({
        success: true,
        data: {
          items: result.items,
          pagination: {
            total: result.total,
            limit: limit ? parseInt(limit as string, 10) : 50,
            skip: skip ? parseInt(skip as string, 10) : 0,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirm delivery of an order item
   * POST /orders/items/:itemId/confirm
   */
  confirmDelivery = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { itemId } = req.params;
      const itemIdStr = Array.isArray(itemId) ? itemId[0] : itemId;
      const userId = req.user!.id;

      const orderItem = await orderService.confirmDelivery(itemIdStr, userId);

      res.status(200).json({
        success: true,
        message: "Đã xác nhận nhận hàng thành công",
        data: {
          _id: orderItem._id,
          itemStatus: orderItem.itemStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel order by seller
   * POST /orders/:orderId/seller-cancel
   */
  cancelOrderBySeller = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
      const userId = req.user!.id;

      const validatedData = cancelOrderSchema.parse(req.body);

      const result = await orderService.cancelOrderBySeller(
        orderIdStr,
        userId,
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  };

  /**
   * Cancel order by buyer
   * POST /orders/:orderId/cancel
   */
  cancelOrderByBuyer = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
      const userId = req.user!.id;

      const validatedData = cancelOrderSchema.parse(req.body);

      const result = await orderService.cancelOrderByBuyer(
        orderIdStr,
        userId,
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(new AppError(error.errors[0].message, 400));
      }
      next(error);
    }
  };

  /**
   * Get escrow status for an order
   * GET /orders/:orderId/escrow-status
   */
  getEscrowStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId } = req.params;
      const orderIdStr = Array.isArray(orderId) ? orderId[0] : orderId;
      const userId = req.user!.id;

      const escrowStatus = await orderService.getEscrowStatus(orderIdStr, userId);

      res.status(200).json({
        success: true,
        data: escrowStatus,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const orderController = new OrderController();
