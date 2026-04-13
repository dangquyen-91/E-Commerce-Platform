import { BaseService } from "../base.service";
import { Wallet, WalletTransaction } from "@/models";
import type { IWallet, IWalletTransaction } from "@/models";
import mongoose from "mongoose";

export class WalletService extends BaseService<IWallet> {
  constructor() {
    super(Wallet);
  }

  /**
   * Get or create wallet for user
   * Uses findOneAndUpdate with upsert to avoid race conditions
   */
  async getOrCreateWallet(userId: string): Promise<IWallet> {
    const userIdObj = new mongoose.Types.ObjectId(userId);
    
    // Use findOneAndUpdate with upsert to atomically get or create
    const wallet = await Wallet.findOneAndUpdate(
      { userId: userIdObj },
      {
        $setOnInsert: {
          userId: userIdObj,
          balance: 0,
          holdBalance: 0,
          currency: "VND",
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!wallet) {
      // Fallback: if findOneAndUpdate fails, try to find existing wallet
      const existingWallet = await this.findOne({ userId: userIdObj });
      if (existingWallet) {
        return existingWallet;
      }
      // Last resort: create new wallet (may fail with duplicate key, but that's ok)
      try {
        return await this.create({
          userId: userIdObj,
          balance: 0,
          holdBalance: 0,
          currency: "VND",
          updatedAt: new Date(),
        });
      } catch (error: any) {
        // If duplicate key error, wallet was created by another request, fetch it
        if (error.code === 11000) {
          const foundWallet = await this.findOne({ userId: userIdObj });
          if (foundWallet) {
            return foundWallet;
          }
        }
        throw error;
      }
    }

    return wallet;
  }

  /**
   * Top up wallet (add money)
   */
  async topUp(
    walletId: string,
    amount: number,
    paymentId: string,
    note?: string
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update wallet balance
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        {
          $inc: { balance: amount },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Create transaction record
      const transaction = await WalletTransaction.create(
        [
          {
            walletId: new mongoose.Types.ObjectId(walletId),
            type: "Topup",
            refType: "System",
            refId: new mongoose.Types.ObjectId(paymentId),
            direction: "In",
            amount,
            note: note || `Nạp tiền từ thanh toán #${paymentId}`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        wallet,
        transaction: transaction[0],
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(
    walletId: string,
    options: {
      limit?: number;
      skip?: number;
      type?: string;
    } = {}
  ): Promise<IWalletTransaction[]> {
    const { limit = 50, skip = 0, type } = options;

    const filter: any = { walletId: new mongoose.Types.ObjectId(walletId) };
    if (type) {
      filter.type = type;
    }

    return WalletTransaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId: string): Promise<number> {
    const wallet = await Wallet.findById(walletId);
    return wallet?.balance || 0;
  }

  /**
   * Deduct money from wallet for purchase
   * Returns the updated wallet and transaction
   */
  async deduct(
    walletId: string,
    amount: number,
    orderId: string,
    note?: string
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check current balance
      const currentWallet = await Wallet.findById(walletId).session(session);
      if (!currentWallet) {
        throw new Error("Wallet not found");
      }

      if (currentWallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Deduct from balance
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        {
          $inc: { balance: -amount },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!wallet) {
        throw new Error("Failed to update wallet");
      }

      // Create transaction record
      const transaction = await WalletTransaction.create(
        [
          {
            walletId: new mongoose.Types.ObjectId(walletId),
            type: "Purchase",
            refType: "Order",
            refId: new mongoose.Types.ObjectId(orderId),
            direction: "Out",
            amount,
            note: note || `Thanh toán đơn hàng #${orderId}`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        wallet,
        transaction: transaction[0],
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Hold money in escrow (move from balance to holdBalance)
   */
  async hold(
    walletId: string,
    amount: number,
    orderItemId: string,
    note?: string
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const currentWallet = await Wallet.findById(walletId).session(session);
      if (!currentWallet) {
        throw new Error("Wallet not found");
      }

      if (currentWallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      // Move from balance to holdBalance
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        {
          $inc: { balance: -amount, holdBalance: amount },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!wallet) {
        throw new Error("Failed to update wallet");
      }

      // Create transaction record
      const transaction = await WalletTransaction.create(
        [
          {
            walletId: new mongoose.Types.ObjectId(walletId),
            type: "Hold",
            refType: "OrderItem",
            refId: new mongoose.Types.ObjectId(orderItemId),
            direction: "Out",
            amount,
            note: note || `Tạm giữ tiền cho đơn hàng`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        wallet,
        transaction: transaction[0],
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Release escrow to seller (disbursement)
   * Deducts from customer holdBalance and adds to seller balance
   */
  async releaseToSeller(
    customerWalletId: string,
    sellerWalletId: string,
    amount: number,
    orderItemId: string,
    note?: string
  ): Promise<{ customerWallet: IWallet; sellerWallet: IWallet; transactions: IWalletTransaction[] }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from customer holdBalance
      const customerWallet = await Wallet.findByIdAndUpdate(
        customerWalletId,
        {
          $inc: { holdBalance: -amount },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!customerWallet) {
        throw new Error("Customer wallet not found");
      }

      // Add to seller balance
      const sellerWallet = await Wallet.findByIdAndUpdate(
        sellerWalletId,
        {
          $inc: { balance: amount },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!sellerWallet) {
        throw new Error("Seller wallet not found");
      }

      // Create transaction records
      const transactions = await WalletTransaction.create(
        [
          {
            walletId: new mongoose.Types.ObjectId(customerWalletId),
            type: "Release",
            refType: "OrderItem",
            refId: new mongoose.Types.ObjectId(orderItemId),
            direction: "Out",
            amount,
            note: note || `Giải phóng tiền escrow cho seller`,
            createdAt: new Date(),
          },
          {
            walletId: new mongoose.Types.ObjectId(sellerWalletId),
            type: "Release",
            refType: "OrderItem",
            refId: new mongoose.Types.ObjectId(orderItemId),
            direction: "In",
            amount,
            note: note || `Nhận tiền từ đơn hàng`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        customerWallet,
        sellerWallet,
        transactions,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  /**
   * Refund escrow to customer (for complaints/disputes)
   * Moves money from holdBalance back to balance
   */
  async refundHold(
    walletId: string,
    amount: number,
    orderItemId: string,
    note?: string
  ): Promise<{ wallet: IWallet; transaction: IWalletTransaction }> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Move from holdBalance back to balance
      const wallet = await Wallet.findByIdAndUpdate(
        walletId,
        {
          $inc: { holdBalance: -amount, balance: amount },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Create transaction record
      const transaction = await WalletTransaction.create(
        [
          {
            walletId: new mongoose.Types.ObjectId(walletId),
            type: "Refund",
            refType: "OrderItem",
            refId: new mongoose.Types.ObjectId(orderItemId),
            direction: "In",
            amount,
            note: note || `Hoàn tiền từ khiếu nại`,
            createdAt: new Date(),
          },
        ],
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return {
        wallet,
        transaction: transaction[0],
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }
}

export const walletService = new WalletService();
