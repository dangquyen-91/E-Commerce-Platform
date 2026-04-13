import { BaseService } from "../base.service";
import { Payment, IPayment } from "@/models";
import mongoose from "mongoose";
import { vnpayService } from "./vnpay.service";
import { walletService } from "../wallets/wallet.service";
import { env } from "@/config/env";

export class PaymentService extends BaseService<IPayment> {
  constructor() {
    super(Payment);
  }

  /**
   * Create payment request for top-up
   */
  async createTopUpPayment(
    userId: string,
    amount: number,
    returnUrl?: string
  ): Promise<{ payment: IPayment; paymentUrl: string }> {
    // Validate amount
    if (amount < 50000 || amount > 50000000) {
      throw new Error("Số tiền nạp phải từ 50,000 VND đến 50,000,000 VND");
    }

    // Get or create wallet
    const wallet = await walletService.getOrCreateWallet(userId);

    // Generate transaction reference
    const transactionRef = `TOPUP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Create payment record
    const payment = await this.create({
      userId: new mongoose.Types.ObjectId(userId),
      walletId: wallet._id,
      amount,
      provider: "VNPay",
      status: "Pending",
      transactionRef,
      orderInfo: `Nạp tiền vào ví - ${amount.toLocaleString("vi-VN")} VND`,
      orderType: "other",
      locale: "vn",
      // IMPORTANT: VNPay should return to backend, backend then redirects to frontend with ref/status
      returnUrl: returnUrl || `${env.backendUrl}/api/payments/vnpay/return`,
      ipnUrl: `${env.backendUrl}/api/payments/vnpay/ipn`,
    });

      // Create VNPay payment URL
      // Note: orderInfo should be simple text without spaces or special characters
      // VNPay requires ASCII characters only for hash calculation
      const orderInfoText = `Naptien${amount}VND`;
      
      // IMPORTANT: Always use backend return URL from config, not from DB
      // This ensures backend processes payment before redirecting to frontend
      const backendReturnUrl = returnUrl || `${env.backendUrl}/api/payments/vnpay/return`;
      
      const paymentUrl = vnpayService.createPaymentUrl({
        amount,
        orderId: transactionRef,
        orderInfo: orderInfoText,
        orderType: "other",
        locale: "vn",
        returnUrl: backendReturnUrl,
      });

    return { payment, paymentUrl };
  }

  /**
   * Handle VNPay IPN callback
   */
  async handleVNPayIpn(params: any): Promise<{ payment: IPayment; success: boolean }> {
    const {
      vnp_Amount,
      vnp_ResponseCode,
      vnp_TransactionNo,
      vnp_TransactionStatus,
      vnp_TxnRef,
      vnp_SecureHash,
    } = params;

    // Verify secure hash
    const isValid = vnpayService.verifyIpn(params as any);
    if (!isValid) {
      throw new Error("Invalid secure hash");
    }

    // Find payment by transaction reference
    const payment = await this.findOne({ transactionRef: vnp_TxnRef });
    if (!payment) {
      throw new Error("Payment not found");
    }

    // Check if already processed
    if (payment.status === "Success") {
      return { payment, success: true };
    }

    // Convert amount from VNPay format (multiply by 100)
    const amount = Number.parseInt(vnp_Amount) / 100;

    // Verify amount matches
    if (amount !== payment.amount) {
      await this.updateById(payment._id.toString(), {
        status: "Failed",
        failureReason: "Amount mismatch",
        vnpResponseCode: vnp_ResponseCode,
        vnpTransactionNo: vnp_TransactionNo,
        vnpSecureHash: vnp_SecureHash,
      });
      throw new Error("Amount mismatch");
    }

    // Check transaction status
    const isSuccess =
      vnp_TransactionStatus === "00" && vnpayService.isSuccessResponse(vnp_ResponseCode);

    if (isSuccess) {
      // Update payment status
      await this.updateById(payment._id.toString(), {
        status: "Success",
        vnpResponseCode: vnp_ResponseCode,
        vnpTransactionNo: vnp_TransactionNo,
        vnpSecureHash: vnp_SecureHash,
        completedAt: new Date(),
      });

      // Top up wallet
      if (payment.walletId) {
        await walletService.topUp(
          payment.walletId.toString(),
          amount,
          payment._id.toString(),
          `Nạp tiền qua VNPay - ${vnp_TransactionNo}`
        );
      }
    } else {
      // Update payment status to failed
      const failureReason = vnpayService.getResponseMessage(vnp_ResponseCode);
      await this.updateById(payment._id.toString(), {
        status: "Failed",
        failureReason,
        vnpResponseCode: vnp_ResponseCode,
        vnpTransactionNo: vnp_TransactionNo,
        vnpSecureHash: vnp_SecureHash,
        completedAt: new Date(),
      });
    }

    const updatedPayment = await this.findById(payment._id.toString());
    return {
      payment: updatedPayment!,
      success: isSuccess,
    };
  }

  /**
   * Get payment by transaction reference
   */
  async getPaymentByRef(transactionRef: string): Promise<IPayment | null> {
    return this.findOne({ transactionRef });
  }

  /**
   * Get user payments
   */
  async getUserPayments(
    userId: string,
    options: {
      limit?: number;
      skip?: number;
      status?: string;
    } = {}
  ): Promise<IPayment[]> {
    const { limit = 50, skip = 0, status } = options;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) {
      filter.status = status;
    }

    return this.findMany(filter, {
      limit,
      skip,
      sort: { createdAt: -1 },
    });
  }
}

export const paymentService = new PaymentService();
