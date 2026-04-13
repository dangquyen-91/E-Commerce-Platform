import { BaseService } from "@/services/base.service";
import { Order, OrderItem, Product, Wallet, WalletTransaction, InventoryItem, Shop, User } from "@/models";
import type { IOrder, IOrderItem } from "@/models";
import { ShopService } from "@/services/shops/shop.service";
import { walletService } from "@/services/wallets/wallet.service";
import { AppError } from "@/middleware/errorHandler";
import mongoose from "mongoose";
import { decryptSecret } from "@/utils/helpers";
import { createLogger, LOG_PREFIXES } from "@/constants";

// Debug logger for order service
const debug = createLogger(LOG_PREFIXES.ORDER_SERVICE);


interface OrderItemInput {
  productId: string;
  quantity: number;
}

interface CreateOrderInput {
  items: OrderItemInput[];
  paymentMethod: "Wallet" | "Momo" | "Vnpay" | "Zalopay";
}

interface CreateOrderResult {
  order: IOrder;
  orderItems: IOrderItem[];
}

export class OrderService extends BaseService<IOrder> {
  constructor() {
    super(Order);
  }

  /**
   * Generate unique order code
   */
  private generateOrderCode(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * Create a new order and process payment
   */
  async createOrder(
    customerUserId: string,
    input: CreateOrderInput
  ): Promise<CreateOrderResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Validate products and calculate total
      const productIds = input.items.map((item) => item.productId);
      const products = await Product.find({
        _id: { $in: productIds },
        status: "Approved",
        isDeleted: false,
      }).session(session);

      if (products.length !== productIds.length) {
        throw new AppError("Một hoặc nhiều sản phẩm không hợp lệ hoặc đã ngừng bán", 400);
      }

      // Build product map for quick lookup
      const productMap = new Map(
        products.map((p) => [p._id.toString(), p])
      );

      // Calculate totals and check inventory availability
      let totalAmount = 0;
      const orderItemsData: any[] = [];
      const shopService = new ShopService();

      for (const item of input.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new AppError(`Sản phẩm ${item.productId} không tồn tại`, 400);
        }

        // Check if enough inventory is available (by shop + platform)
        const availableInventory = await InventoryItem.countDocuments({
          shopId: product.shopId,
          platformId: product.platformId,
          status: "Available",
          isDeleted: false,
        }).session(session);

        if (availableInventory < item.quantity) {
          throw new AppError(
            `Sản phẩm "${product.title}" chỉ còn ${availableInventory} tài khoản, không đủ ${item.quantity} yêu cầu`,
            400
          );
        }

        const subtotal = product.price * item.quantity;
        totalAmount += subtotal;

        orderItemsData.push({
          productId: product._id,
          shopId: product.shopId,
          platformId: product.platformId,
          quantity: item.quantity,
          unitPrice: product.price,
          subtotal,
        });
      }

      // Calculate fee (5%) - phí này người BÁN trả, không phải người mua
      // Người mua chỉ trả totalAmount, người bán sẽ bị trừ feeAmount khi nhận tiền
      const feeAmount = Math.round(totalAmount * 0.05);
      const payableAmount = totalAmount; // Người mua chỉ trả giá gốc

      // 2. Check wallet balance (if paying with wallet)
      if (input.paymentMethod === "Wallet") {
        const wallet = await walletService.getOrCreateWallet(customerUserId);

        if (wallet.balance < payableAmount) {
          throw new AppError(
            `Số dư ví không đủ. Cần ${payableAmount.toLocaleString("vi-VN")} VND, hiện có ${wallet.balance.toLocaleString("vi-VN")} VND`,
            400
          );
        }
      }

      // 3. Create Order
      const orderCode = this.generateOrderCode();
      const [order] = await Order.create(
        [
          {
            orderCode,
            customerUserId: new mongoose.Types.ObjectId(customerUserId),
            totalAmount,
            feeAmount,
            payableAmount,
            status: input.paymentMethod === "Wallet" ? "Paid" : "PendingPayment",
            paymentProvider: input.paymentMethod,
            paidAt: input.paymentMethod === "Wallet" ? new Date() : null,
          },
        ],
        { session, ordered: true }
      );

      // 4. Create OrderItems and handle inventory
      // If payment is Wallet (immediate), deliver keys right away
      // Otherwise, reserve inventory and wait for payment
      const isImmediatePayment = input.paymentMethod === "Wallet";
      const now = new Date();
      const safeUntil = new Date();
      safeUntil.setDate(safeUntil.getDate() + 7); // 7 days warranty period

      const orderItemsToCreate = [];
      const inventoryUpdates = [];

      for (const item of orderItemsData) {
        // Get available inventory items by shop + platform
        const inventoryItems = await InventoryItem.find({
          shopId: item.shopId,
          platformId: item.platformId,
          status: "Available",
          isDeleted: false,
        })
          .limit(item.quantity)
          .session(session);

        if (inventoryItems.length < item.quantity) {
          throw new AppError(
            `Không đủ tài khoản trong kho. Cần ${item.quantity}, còn ${inventoryItems.length}`,
            400
          );
        }

        // Create one OrderItem per inventory item (for quantity > 1)
        for (let i = 0; i < item.quantity; i++) {
          const inventory = inventoryItems[i];

          orderItemsToCreate.push({
            orderId: order._id,
            shopId: item.shopId,
            productId: item.productId,
            quantity: 1,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice,
            // If paid immediately, deliver right away; otherwise wait for payment
            itemStatus: isImmediatePayment ? "Delivered" : "WaitingDelivery",
            deliveredAt: isImmediatePayment ? now : null,
            safeUntil,
            holdAmount: item.unitPrice,
            holdStatus: "Holding",
            holdAt: now,
            inventoryItemId: inventory._id, // Link to inventory
          });

          // If delivered immediately (wallet payment), increase shop total sales counter per item
          if (isImmediatePayment) {
            shopService
              .incrementSales(item.shopId.toString(), 1)
              .catch(() => undefined);
          }

          // Update inventory status based on payment
          inventoryUpdates.push({
            updateOne: {
              filter: { _id: inventory._id },
              update: {
                $set: isImmediatePayment
                  ? {
                      status: "Delivered" as const,
                      reservedAt: now,
                      deliveredAt: now,
                    }
                  : {
                      status: "Reserved" as const,
                      reservedAt: now,
                    },
              },
            },
          });
        }
      }

      // Bulk update inventory items to Reserved
      if (inventoryUpdates.length > 0) {
        await InventoryItem.bulkWrite(inventoryUpdates, { session });
      }

      // Create all order items
      const orderItems = await OrderItem.create(orderItemsToCreate, { session, ordered: true });

      // 5. Process payment (if paying with wallet)
      if (input.paymentMethod === "Wallet") {
        const wallet = await walletService.getOrCreateWallet(customerUserId);

        // Move money from balance to holdBalance (escrow)
        // This ensures money is held until delivery is confirmed
        await Wallet.findByIdAndUpdate(
          wallet._id,
          {
            $inc: { 
              balance: -payableAmount,
              holdBalance: payableAmount 
            },
            $set: { updatedAt: new Date() },
          },
          { session }
        );

        // Create wallet transaction for the hold
        await WalletTransaction.create(
          [
            {
              walletId: wallet._id,
              type: "Hold",
              refType: "Order",
              refId: order._id,
              direction: "Out",
              amount: payableAmount,
              note: `Tạm giữ tiền cho đơn hàng #${orderCode} (Escrow)`,
              createdAt: new Date(),
            },
          ],
          { session, ordered: true }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return {
        order,
        orderItems,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get order items for a seller (by shop owner userId)
   * Includes customer info, product info and delivered credential (decrypted)
   * Enhanced with additional fields for dispute resolution
   */
  async getOrderItemsBySeller(
    sellerUserId: string,
    options: {
      limit?: number;
      skip?: number;
      status?: string;
    } = {}
  ): Promise<{
    items: any[];
    total: number;
  }> {
    debug.log("getOrderItemsBySeller called", { sellerUserId, options });

    // Find shop owned by this user
    const shop = await Shop.findOne({
      ownerUserId: new mongoose.Types.ObjectId(sellerUserId),
      isDeleted: false,
    });

    if (!shop) {
      debug.warn("No shop found for seller", { sellerUserId });
      return { items: [], total: 0 };
    }

    debug.log("Found shop", { shopId: shop._id.toString(), shopName: shop.shopName });

    const { limit = 50, skip = 0, status } = options;

    const filter: any = {
      shopId: shop._id,
    };

    if (status) {
      filter.itemStatus = status;
    }

    const query = OrderItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "orderId",
        populate: {
          path: "customerUserId",
          model: User,
          select: "_id email fullName phone", // Include phone for dispute resolution
        },
      })
      .populate("productId")
      .populate("inventoryItemId");

    const [items, total] = await Promise.all([
      query.exec(),
      OrderItem.countDocuments(filter),
    ]);

    debug.log("Found order items", { count: items.length, total });

    const mappedItems = items.map((item) => {
      const order = item.orderId as any;
      const customer = order?.customerUserId as any;
      const product = item.productId as any;
      const inventory = item.inventoryItemId as any;

      let credential: string | null = null;
      if (inventory?.secretValue) {
        try {
          credential = decryptSecret(inventory.secretValue as string);
        } catch (err) {
          debug.error("Failed to decrypt credential", { itemId: item._id.toString(), error: err });
          credential = null;
        }
      }

      const mapped = {
        // IDs for reference (useful for dispute resolution)
        id: item._id.toString(),
        orderId: order?._id?.toString() || null,
        inventoryItemId: inventory?._id?.toString() || null,

        // Order info
        orderCode: order?.orderCode,
        orderCreatedAt: order?.createdAt,
        orderStatus: order?.status,

        // Customer info (enhanced for dispute resolution)
        customer: customer
          ? {
              id: customer._id?.toString(),
              email: customer.email,
              fullName: customer.fullName,
              phone: customer.phone || null, // Include phone for dispute contact
            }
          : null,

        // Product info
        product: product
          ? {
              id: product._id?.toString(),
              title: product.title,
              planType: product.planType,
              durationDays: product.durationDays,
              thumbnailUrl: product.thumbnailUrl,
            }
          : null,

        // Pricing
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,

        // Status and escrow
        itemStatus: item.itemStatus,
        holdStatus: item.holdStatus,
        holdAmount: item.holdAmount,

        // Important dates for dispute resolution
        createdAt: item.createdAt, // When item was created
        deliveredAt: item.deliveredAt, // When key was delivered
        safeUntil: item.safeUntil, // Warranty deadline - important for disputes!
        holdAt: item.holdAt, // When escrow started
        releaseAt: item.releaseAt, // When escrow was released

        // The actual credential/key
        credential,

        // Secret type for display
        secretType: inventory?.secretType || null,
      };
      return mapped;
    });

    debug.log("Mapped items successfully", { mappedCount: mappedItems.length });

    return {
      items: mappedItems,
      total,
    };
  }

  /**
   * Get order by ID with items
   */
  async getOrderById(orderId: string): Promise<{
    order: IOrder;
    items: IOrderItem[];
  } | null> {
    const order = await Order.findById(orderId).populate("customerUserId");
    if (!order) {
      return null;
    }

    const items = await OrderItem.find({ orderId })
      .populate("productId")
      .populate("shopId");

    return { order, items };
  }

  /**
   * Get order by order code
   */
  async getOrderByCode(orderCode: string): Promise<{
    order: IOrder;
    items: IOrderItem[];
  } | null> {
    const order = await Order.findOne({ orderCode }).populate("customerUserId");
    if (!order) {
      return null;
    }

    const items = await OrderItem.find({ orderId: order._id })
      .populate("productId")
      .populate("shopId")
      .populate("inventoryItemId"); // Include credentials from inventory

    // Decrypt inventory secrets before returning to FE
    items.forEach((item) => {
      const inventory = item.inventoryItemId as any;

      if (item.inventoryItemId && inventory?.secretValue) {
        const encrypted = inventory.secretValue as string;
        const decrypted = decryptSecret(encrypted);
        inventory.secretValue = decrypted;
      }
    });

    return { order, items };
  }

  /**
   * Get orders by customer
   */
  async getOrdersByCustomer(
    customerUserId: string,
    options: {
      limit?: number;
      skip?: number;
      status?: string;
    } = {}
  ): Promise<IOrder[]> {
    const { limit = 20, skip = 0, status } = options;

    const filter: any = {
      customerUserId: new mongoose.Types.ObjectId(customerUserId),
    };

    if (status) {
      filter.status = status;
    }

    return Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  /**
   * Confirm delivery of an order item (customer confirms receipt)
   * This changes the item status from "Delivered" to "Completed"
   */
  async confirmDelivery(
    orderItemId: string,
    customerUserId: string
  ): Promise<IOrderItem> {
    // Find the order item
    const orderItem = await OrderItem.findById(orderItemId).populate("orderId");

    if (!orderItem) {
      throw new AppError("Không tìm thấy mục đơn hàng", 404);
    }

    // Check ownership via orderId
    const order = orderItem.orderId as any;
    if (!order || order.customerUserId.toString() !== customerUserId) {
      throw new AppError("Bạn không có quyền xác nhận mục này", 403);
    }

    // Check current status - must be "Delivered"
    if (orderItem.itemStatus !== "Delivered") {
      throw new AppError(
        `Không thể xác nhận. Trạng thái hiện tại: ${orderItem.itemStatus}`,
        400
      );
    }

    // Update status to Completed
    orderItem.itemStatus = "Completed";
    await orderItem.save();

    debug.log("Order item confirmed as Completed", {
      orderItemId,
      customerUserId,
    });

    return orderItem;
  }

  /**
   * Cancel an order by seller
   * Seller can only cancel within 24h of order creation
   * Refunds the full amount back to customer's balance
   */
  async cancelOrderBySeller(
    orderId: string,
    sellerUserId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find order with items
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      // Check if order is in valid status for cancellation
      if (order.status !== "Paid") {
        throw new AppError(
          `Không thể hủy đơn hàng với trạng thái: ${order.status}`,
          400
        );
      }

      // Check 24h time limit
      const orderCreatedAt = new Date(order.createdAt);
      const now = new Date();
      const hoursPassed = (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursPassed > 24) {
        throw new AppError(
          "Đã quá thời hạn hủy đơn (24 giờ sau khi đặt hàng)",
          400
        );
      }

      // Get order items and verify seller owns at least one item
      const orderItems = await OrderItem.find({ orderId: order._id })
        .populate("shopId")
        .session(session);

      // Check if seller owns any of the items
      const sellerItems = orderItems.filter((item) => {
        const shop = item.shopId as any;
        return shop?.ownerUserId?.toString() === sellerUserId;
      });

      if (sellerItems.length === 0) {
        throw new AppError("Bạn không có quyền hủy đơn hàng này", 403);
      }

      // Check for open complaints
      await InventoryItem.findOne({
        _id: {
          $in: orderItems
            .map((item) => item.inventoryItemId)
            .filter((id): id is mongoose.Types.ObjectId => Boolean(id)),
        },
      }).session(session);

      // Get customer wallet
      const customerWallet = await Wallet.findOne({
        userId: order.customerUserId,
      }).session(session);

      if (!customerWallet) {
        throw new AppError("Không tìm thấy ví khách hàng", 500);
      }

      // Calculate total refund amount from items with holdStatus = "Holding"
      let totalRefundAmount = 0;
      const itemsToRefund = orderItems.filter(
        (item) => item.holdStatus === "Holding"
      );

      for (const item of itemsToRefund) {
        totalRefundAmount += item.holdAmount;
      }

      if (totalRefundAmount > 0) {
        // Refund from holdBalance back to balance
        await Wallet.findByIdAndUpdate(
          customerWallet._id,
          {
            $inc: {
              holdBalance: -totalRefundAmount,
              balance: totalRefundAmount,
            },
            $set: { updatedAt: new Date() },
          },
          { session }
        );

        // Create refund transaction
        await WalletTransaction.create(
          [
            {
              walletId: customerWallet._id,
              type: "Refund",
              refType: "Order",
              refId: order._id,
              direction: "In",
              amount: totalRefundAmount,
              note: `Hoàn tiền do seller hủy đơn #${order.orderCode}. Lý do: ${reason}`,
              createdAt: new Date(),
            },
          ],
          { session }
        );
      }

      // Update all order items
      await OrderItem.updateMany(
        { orderId: order._id },
        {
          $set: {
            itemStatus: "Refunded",
            holdStatus: "Refunded",
            releaseAt: new Date(),
          },
        },
        { session }
      );

      // Release inventory back to available
      const inventoryIds = orderItems
        .map((item) => item.inventoryItemId)
        .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

      if (inventoryIds.length > 0) {
        await InventoryItem.updateMany(
          { _id: { $in: inventoryIds } },
          {
            $set: {
              status: "Available",
              reservedAt: null,
              deliveredAt: null,
            },
          },
          { session }
        );
      }

      // Update order status
      await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: "Cancelled",
            cancelledAt: new Date(),
            cancelReason: reason,
            cancelledBy: "Seller",
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      debug.log("Order cancelled by seller", {
        orderId,
        sellerUserId,
        refundAmount: totalRefundAmount,
      });

      return {
        success: true,
        message: `Đã hủy đơn hàng và hoàn ${totalRefundAmount.toLocaleString("vi-VN")} VND cho khách hàng`,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Cancel an order by buyer
   * Buyer can cancel:
   * - PendingPayment orders: no refund needed
   * - Paid orders before delivery: full refund
   */
  async cancelOrderByBuyer(
    orderId: string,
    buyerUserId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order) {
        throw new AppError("Đơn hàng không tồn tại", 404);
      }

      // Check ownership
      if (order.customerUserId.toString() !== buyerUserId) {
        throw new AppError("Bạn không có quyền hủy đơn hàng này", 403);
      }

      // Check status
      if (order.status === "Completed" || order.status === "Cancelled" || order.status === "Refunded") {
        throw new AppError(
          `Không thể hủy đơn hàng với trạng thái: ${order.status}`,
          400
        );
      }

      const orderItems = await OrderItem.find({ orderId: order._id }).session(session);

      // Check if any item has been delivered (check deliveredAt)
      const hasDeliveredItems = orderItems.some(
        (item) => item.itemStatus === "Delivered" || item.itemStatus === "Completed"
      );

      if (hasDeliveredItems) {
        throw new AppError(
          "Không thể hủy đơn hàng đã có sản phẩm được giao. Vui lòng tạo khiếu nại nếu có vấn đề.",
          400
        );
      }

      let totalRefundAmount = 0;

      // If order was paid, process refund
      if (order.status === "Paid") {
        const customerWallet = await Wallet.findOne({
          userId: order.customerUserId,
        }).session(session);

        if (!customerWallet) {
          throw new AppError("Không tìm thấy ví khách hàng", 500);
        }

        // Calculate refund from holding items
        const holdingItems = orderItems.filter(
          (item) => item.holdStatus === "Holding"
        );

        for (const item of holdingItems) {
          totalRefundAmount += item.holdAmount;
        }

        if (totalRefundAmount > 0) {
          // Refund from holdBalance to balance
          await Wallet.findByIdAndUpdate(
            customerWallet._id,
            {
              $inc: {
                holdBalance: -totalRefundAmount,
                balance: totalRefundAmount,
              },
              $set: { updatedAt: new Date() },
            },
            { session }
          );

          // Create refund transaction
          await WalletTransaction.create(
            [
              {
                walletId: customerWallet._id,
                type: "Refund",
                refType: "Order",
                refId: order._id,
                direction: "In",
                amount: totalRefundAmount,
                note: `Hoàn tiền do hủy đơn #${order.orderCode}. Lý do: ${reason}`,
                createdAt: new Date(),
              },
            ],
            { session }
          );
        }
      }

      // Update order items
      await OrderItem.updateMany(
        { orderId: order._id },
        {
          $set: {
            itemStatus: "Refunded",
            holdStatus: "Refunded",
            releaseAt: new Date(),
          },
        },
        { session }
      );

      // Release inventory
      const inventoryIds = orderItems
        .map((item) => item.inventoryItemId)
        .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

      if (inventoryIds.length > 0) {
        await InventoryItem.updateMany(
          { _id: { $in: inventoryIds } },
          {
            $set: {
              status: "Available",
              reservedAt: null,
              deliveredAt: null,
            },
          },
          { session }
        );
      }

      // Update order
      await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            status: "Cancelled",
            cancelledAt: new Date(),
            cancelReason: reason,
            cancelledBy: "Buyer",
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      debug.log("Order cancelled by buyer", {
        orderId,
        buyerUserId,
        refundAmount: totalRefundAmount,
      });

      return {
        success: true,
        message: totalRefundAmount > 0
          ? `Đã hủy đơn hàng và hoàn ${totalRefundAmount.toLocaleString("vi-VN")} VND`
          : "Đã hủy đơn hàng",
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get escrow status for an order
   */
  async getEscrowStatus(
    orderId: string,
    userId: string
  ): Promise<{
    orderId: string;
    orderCode: string;
    totalHoldAmount: number;
    items: any[];
    summary: {
      holding: number;
      released: number;
      refunded: number;
    };
  }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError("Đơn hàng không tồn tại", 404);
    }

    // Check ownership (customer or seller can view)
    const orderItems = await OrderItem.find({ orderId })
      .populate("productId")
      .populate("shopId");

    const isCustomer = order.customerUserId.toString() === userId;
    const isSeller = orderItems.some((item) => {
      const shop = item.shopId as any;
      return shop?.ownerUserId?.toString() === userId;
    });

    if (!isCustomer && !isSeller) {
      throw new AppError("Bạn không có quyền xem thông tin này", 403);
    }

    const ESCROW_PERIOD_HOURS = 72;
    const COMPLAINT_WINDOW_HOURS = 72;

    const items = orderItems.map((item) => {
      const product = item.productId as any;
      const holdAt = item.holdAt ? new Date(item.holdAt) : null;
      const now = new Date();

      let timeRemaining: number | undefined;
      let canComplaint = false;
      let complaintDeadline: Date | undefined;

      if (holdAt && item.holdStatus === "Holding") {
        const msRemaining = holdAt.getTime() + ESCROW_PERIOD_HOURS * 60 * 60 * 1000 - now.getTime();
        timeRemaining = Math.max(0, Math.floor(msRemaining / 1000));

        const complaintDeadlineMs = holdAt.getTime() + COMPLAINT_WINDOW_HOURS * 60 * 60 * 1000;
        complaintDeadline = new Date(complaintDeadlineMs);
        canComplaint = now.getTime() < complaintDeadlineMs;
      }

      return {
        orderItemId: item._id.toString(),
        productTitle: product?.title || "N/A",
        holdAmount: item.holdAmount,
        holdStatus: item.holdStatus,
        holdAt: item.holdAt,
        releaseAt: item.releaseAt,
        timeRemaining,
        canComplaint,
        complaintDeadline,
      };
    });

    const summary = {
      holding: orderItems
        .filter((item) => item.holdStatus === "Holding")
        .reduce((sum, item) => sum + item.holdAmount, 0),
      released: orderItems
        .filter((item) => item.holdStatus === "Released")
        .reduce((sum, item) => sum + item.holdAmount, 0),
      refunded: orderItems
        .filter((item) => item.holdStatus === "Refunded")
        .reduce((sum, item) => sum + item.holdAmount, 0),
    };

    return {
      orderId: order._id.toString(),
      orderCode: order.orderCode,
      totalHoldAmount: order.payableAmount,
      items,
      summary,
    };
  }
}

export const orderService = new OrderService();
