import mongoose from "mongoose";
import { Order, OrderItem, Wallet, WalletTransaction, InventoryItem, SupportTicket } from "@/models";
import { walletService } from "@/services/wallets/wallet.service";

const ESCROW_PERIOD_HOURS = 72; // 3 days

export class DisbursementService {
  /**
   * Process disbursement for a single order item
   * Releases escrow to seller after 72h if no complaint
   */
  async processOrderItemDisbursement(orderItemId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderItem = await OrderItem.findById(orderItemId)
        .populate("orderId")
        .populate("shopId")
        .session(session);

      if (!orderItem) {
        throw new Error("Order item not found");
      }

      // Check if already processed
      if (orderItem.holdStatus !== "Holding") {
        return {
          success: false,
          message: `Order item already processed: ${orderItem.holdStatus}`,
        };
      }

      // Check if 72h has passed
      const holdAt = new Date(orderItem.holdAt);
      const now = new Date();
      const hoursPassed = (now.getTime() - holdAt.getTime()) / (1000 * 60 * 60);

      if (hoursPassed < ESCROW_PERIOD_HOURS) {
        return {
          success: false,
          message: `Escrow period not yet completed. Hours passed: ${hoursPassed.toFixed(2)}`,
        };
      }

      // Check for open complaints/tickets
      const openTicket = await SupportTicket.findOne({
        orderItemId: orderItem._id,
        status: { $in: ["Open", "InReview", "NeedMoreInfo"] },
      }).session(session);

      if (openTicket) {
        return {
          success: false,
          message: `Cannot disburse: Open complaint exists (Ticket: ${openTicket.ticketCode})`,
        };
      }

      // Get customer wallet
      const order = orderItem.orderId as any;
      const customerWallet = await Wallet.findOne({
        userId: order.customerUserId,
      }).session(session);

      if (!customerWallet) {
        throw new Error("Customer wallet not found");
      }

      // Get seller wallet (shop owner)
      const shop = orderItem.shopId as any;
      const sellerWallet = await walletService.getOrCreateWallet(
        shop.ownerUserId.toString()
      );

      // Calculate platform fee (5%) - người BÁN trả phí này
      const platformFee = Math.round(orderItem.holdAmount * 0.05);
      const sellerReceiveAmount = orderItem.holdAmount - platformFee;

      // Release escrow: Customer holdBalance giảm toàn bộ holdAmount
      // Seller chỉ nhận holdAmount - platformFee (95%)
      // Platform Fee (5%) được giữ lại trong hệ thống
      await Wallet.findByIdAndUpdate(
        customerWallet._id,
        {
          $inc: { holdBalance: -orderItem.holdAmount },
          $set: { updatedAt: new Date() },
        },
        { session }
      );

      // Seller nhận tiền sau khi trừ phí 5%
      await Wallet.findByIdAndUpdate(
        sellerWallet._id,
        {
          $inc: { balance: sellerReceiveAmount },
          $set: { updatedAt: new Date() },
        },
        { session }
      );

      // Create WalletTransaction records for audit trail
      const orderItemObjId = new mongoose.Types.ObjectId(orderItemId);
      await WalletTransaction.create(
        [
          {
            walletId: customerWallet._id,
            type: "Release",
            refType: "OrderItem",
            refId: orderItemObjId,
            direction: "Out",
            amount: orderItem.holdAmount,
            note: `Giải ngân đơn hàng #${order.orderCode} - Platform fee: ${platformFee} VND`,
            createdAt: new Date(),
          },
          {
            walletId: sellerWallet._id,
            type: "Release",
            refType: "OrderItem",
            refId: orderItemObjId,
            direction: "In",
            amount: sellerReceiveAmount,
            note: `Nhận tiền từ đơn hàng #${order.orderCode} (sau phí 5%)`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      // Update order item status
      await OrderItem.findByIdAndUpdate(
        orderItemId,
        {
          $set: {
            holdStatus: "Released",
            releaseAt: new Date(),
            itemStatus: "Completed",
          },
        },
        { session }
      );

      // Update inventory status to Delivered
      if (orderItem.inventoryItemId) {
        await InventoryItem.findByIdAndUpdate(
          orderItem.inventoryItemId,
          {
            $set: {
              status: "Delivered",
              deliveredAt: new Date(),
            },
          },
          { session }
        );
      }

      // Check if all order items are completed, then update order status
      const allOrderItems = await OrderItem.find({
        orderId: order._id,
      }).session(session);

      const allCompleted = allOrderItems.every(
        (item) =>
          item._id.toString() === orderItemId ||
          item.itemStatus === "Completed" ||
          item.itemStatus === "Refunded"
      );

      if (allCompleted) {
        await Order.findByIdAndUpdate(
          order._id,
          {
            $set: { status: "Completed" },
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: `Disbursed ${sellerReceiveAmount} VND to seller (after ${platformFee} VND platform fee)`,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Process all pending disbursements (cron job)
   * Finds all order items past 72h and processes them
   */
  async processAllPendingDisbursements(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - ESCROW_PERIOD_HOURS);

    // Find all order items that:
    // 1. Have holdStatus = "Holding"
    // 2. holdAt is older than 72 hours
    const pendingItems = await OrderItem.find({
      holdStatus: "Holding",
      holdAt: { $lte: cutoffTime },
    }).limit(100); // Process in batches

    const results = {
      processed: pendingItems.length,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const item of pendingItems) {
      try {
        const result = await this.processOrderItemDisbursement(
          item._id.toString()
        );
        if (result.success) {
          results.succeeded++;
        } else {
          results.failed++;
          results.errors.push(`${item._id}: ${result.message}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`${item._id}: ${error.message}`);
      }
    }

    return results;
  }

  /**
   * Process refund for a complaint
   * Called when admin resolves a complaint with refund
   */
  async processRefund(
    orderItemId: string,
    refundAmount: number,
    _ticketId: string
  ): Promise<{ success: boolean; message: string }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const orderItem = await OrderItem.findById(orderItemId)
        .populate("orderId")
        .session(session);

      if (!orderItem) {
        throw new Error("Order item not found");
      }

      if (orderItem.holdStatus !== "Holding") {
        throw new Error(`Cannot refund: Hold status is ${orderItem.holdStatus}`);
      }

      const order = orderItem.orderId as any;
      const customerWallet = await Wallet.findOne({
        userId: order.customerUserId,
      }).session(session);

      if (!customerWallet) {
        throw new Error("Customer wallet not found");
      }

      // Refund from holdBalance back to balance
      await Wallet.findByIdAndUpdate(
        customerWallet._id,
        {
          $inc: {
            holdBalance: -refundAmount,
            balance: refundAmount,
          },
          $set: { updatedAt: new Date() },
        },
        { session }
      );

      // Create WalletTransaction for audit trail
      await WalletTransaction.create(
        [
          {
            walletId: customerWallet._id,
            type: "Refund",
            refType: "OrderItem",
            refId: new mongoose.Types.ObjectId(orderItemId),
            direction: "In",
            amount: refundAmount,
            note: `Hoàn tiền từ khiếu nại đơn hàng #${order.orderCode}`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      // Update order item
      await OrderItem.findByIdAndUpdate(
        orderItemId,
        {
          $set: {
            holdStatus: "Refunded",
            releaseAt: new Date(),
            itemStatus: "Refunded",
          },
        },
        { session }
      );

      // Release inventory back to available (if applicable)
      if (orderItem.inventoryItemId) {
        await InventoryItem.findByIdAndUpdate(
          orderItem.inventoryItemId,
          {
            $set: {
              status: "Available",
              reservedAt: null,
            },
          },
          { session }
        );
      }

      // Check if all items are refunded, update order status
      const allOrderItems = await OrderItem.find({
        orderId: order._id,
      }).session(session);

      const allRefunded = allOrderItems.every(
        (item) =>
          item._id.toString() === orderItemId || item.itemStatus === "Refunded"
      );

      if (allRefunded) {
        await Order.findByIdAndUpdate(
          order._id,
          { $set: { status: "Refunded" } },
          { session }
        );
      } else {
        // Mark as disputed if some items refunded
        await Order.findByIdAndUpdate(
          order._id,
          { $set: { status: "Disputed" } },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      return {
        success: true,
        message: `Refunded ${refundAmount} VND to customer`,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export const disbursementService = new DisbursementService();
