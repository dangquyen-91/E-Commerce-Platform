import { Response, NextFunction } from "express";
import { paymentService } from "@/services/payments/payment.service";
import { walletService } from "@/services/wallets/wallet.service";
import { AppError } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";
import { AuthRequest } from "@/middleware/auth";

export class PaymentController {
  /**
   * Create top-up payment request
   * POST /api/payments/topup
   */
  async createTopUp(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(MESSAGES.ERROR.AUTH.UNAUTHORIZED, 401);
      }

      const { amount } = req.body;

      if (!amount || typeof amount !== "number") {
        throw new AppError("Số tiền nạp không hợp lệ", 400);
      }

      if (amount < 50000 || amount > 50000000) {
        throw new AppError("Số tiền nạp phải từ 50,000 VND đến 50,000,000 VND", 400);
      }

      const { payment, paymentUrl } = await paymentService.createTopUpPayment(
        userId,
        amount
      );

      res.status(200).json({
        success: true,
        data: {
          payment: {
            id: payment._id,
            transactionRef: payment.transactionRef,
            amount: payment.amount,
            status: payment.status,
            createdAt: payment.createdAt,
          },
          paymentUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle VNPay IPN callback
   * POST /api/payments/vnpay/ipn
   */
  async handleVNPayIpn(req: any, res: Response) {
    try {
      const result = await paymentService.handleVNPayIpn(req.query);

      // VNPay expects specific response format
      res.status(200).json({
        RspCode: result.success ? "00" : "99",
        Message: result.success ? "Confirm Success" : "Confirm Fail",
      });
    } catch {
      res.status(200).json({
        RspCode: "99",
        Message: "Confirm Fail",
      });
    }
  }

  /**
   * Handle VNPay return URL
   * GET /api/payments/vnpay/return
   */
  async handleVNPayReturn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { vnp_TxnRef } = req.query;

      // For local/dev environment, VNPay IPN may not be able to call our server (localhost).
      // To ensure wallet is credited, we reuse the same logic as IPN here as well.
      try {
        await paymentService.handleVNPayIpn(req.query);
      } catch {
        // Non-blocking - continue with redirect
      }

      if (!vnp_TxnRef || Array.isArray(vnp_TxnRef) || typeof vnp_TxnRef !== "string") {
        throw new AppError("Missing or invalid transaction reference", 400);
      }

      const transactionRef = vnp_TxnRef;
      const payment = await paymentService.getPaymentByRef(transactionRef);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // Redirect to frontend wallet page directly (user wants to go straight to wallet)
      const frontendUrl = process.env.CORS_ORIGIN || "http://localhost:3000";
      const status = payment.status.toLowerCase();
      
      // Redirect directly to wallet page with success indicator
      // Frontend will show toast notification and refresh wallet balance
      const redirectUrl = `${frontendUrl}/customer/wallet?topup=${status}&ref=${transactionRef}`;

      res.redirect(redirectUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment status
   * GET /api/payments/:transactionRef
   */
  async getPaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(MESSAGES.ERROR.AUTH.UNAUTHORIZED, 401);
      }

      const { transactionRef: transactionRefParam } = req.params;
      
      if (Array.isArray(transactionRefParam)) {
        throw new AppError("Invalid transaction reference", 400);
      }
      
      const transactionRef = transactionRefParam || "";

      const payment = await paymentService.getPaymentByRef(transactionRef);

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // Check if payment belongs to user
      if (payment.userId.toString() !== userId) {
        throw new AppError("Unauthorized", 403);
      }

      res.status(200).json({
        success: true,
        data: {
          id: payment._id,
          transactionRef: payment.transactionRef,
          amount: payment.amount,
          status: payment.status,
          provider: payment.provider,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
          failureReason: payment.failureReason,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user payments
   * GET /api/payments
   */
  async getUserPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(MESSAGES.ERROR.AUTH.UNAUTHORIZED, 401);
      }

      const { limit = 50, skip = 0, status } = req.query;

      const payments = await paymentService.getUserPayments(userId, {
        limit: Number.parseInt(limit as string, 10),
        skip: Number.parseInt(skip as string, 10),
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: payments.map((payment) => ({
          id: payment._id,
          transactionRef: payment.transactionRef,
          amount: payment.amount,
          status: payment.status,
          provider: payment.provider,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet balance
   * GET /api/wallets/balance
   */
  async getWalletBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError(MESSAGES.ERROR.AUTH.UNAUTHORIZED, 401);
      }

      const wallet = await walletService.getOrCreateWallet(userId);

      res.status(200).json({
        success: true,
        data: {
          balance: wallet.balance,
          holdBalance: wallet.holdBalance,
          totalBalance: wallet.balance + wallet.holdBalance,
          currency: wallet.currency,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get wallet transactions
   * GET /api/wallets/transactions
   */
  async getWalletTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError(MESSAGES.ERROR.AUTH.UNAUTHORIZED, 401);
      }

      const wallet = await walletService.getOrCreateWallet(userId);
      const { limit = 50, skip = 0, type } = req.query;

      const transactions = await walletService.getTransactions(wallet._id.toString(), {
        limit: Number.parseInt(limit as string, 10),
        skip: Number.parseInt(skip as string, 10),
        type: type as string,
      });

      res.status(200).json({
        success: true,
        data: transactions.map((txn) => ({
          id: txn._id,
          type: txn.type,
          direction: txn.direction,
          amount: txn.amount,
          note: txn.note,
          createdAt: txn.createdAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
