import { Router } from "express";
import { paymentController } from "@/controllers/payments/payment.controller";
import { authenticate } from "@/middleware/auth";

const router = Router();

// Top-up payment
router.post("/topup", authenticate, paymentController.createTopUp.bind(paymentController));

// VNPay callbacks
router.post("/vnpay/ipn", paymentController.handleVNPayIpn.bind(paymentController));
router.get("/vnpay/return", paymentController.handleVNPayReturn.bind(paymentController));

// Wallet endpoints
router.get("/wallets/balance", authenticate, paymentController.getWalletBalance.bind(paymentController));
router.get("/wallets/transactions", authenticate, paymentController.getWalletTransactions.bind(paymentController));

// Get user payments
router.get("/", authenticate, paymentController.getUserPayments.bind(paymentController));

// Get payment status (keep LAST to avoid shadowing other routes)
router.get("/:transactionRef", authenticate, paymentController.getPaymentStatus.bind(paymentController));

export default router;
