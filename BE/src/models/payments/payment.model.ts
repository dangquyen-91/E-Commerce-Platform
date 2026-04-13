import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "Pending" | "Processing" | "Success" | "Failed" | "Cancelled";
export type PaymentProvider = "VNPay" | "Momo" | "ZaloPay" | "Bank";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  walletId?: mongoose.Types.ObjectId | null;
  amount: number; // VND
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionRef: string; // VNPay transaction reference
  vnpTxnRef?: string; // VNPay transaction reference
  vnpResponseCode?: string; // VNPay response code
  vnpTransactionNo?: string; // VNPay transaction number
  vnpSecureHash?: string; // VNPay secure hash
  ipnUrl?: string; // IPN callback URL
  returnUrl?: string; // Return URL after payment
  orderInfo?: string; // Order description
  orderType?: string; // Order type
  locale?: string; // Language
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  failureReason?: string | null;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    provider: {
      type: String,
      required: true,
      enum: ["VNPay", "Momo", "ZaloPay", "Bank"],
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Processing", "Success", "Failed", "Cancelled"],
      default: "Pending",
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
    },
    vnpTxnRef: {
      type: String,
      default: null,
    },
    vnpResponseCode: {
      type: String,
      default: null,
    },
    vnpTransactionNo: {
      type: String,
      default: null,
    },
    vnpSecureHash: {
      type: String,
      default: null,
    },
    ipnUrl: {
      type: String,
      default: null,
    },
    returnUrl: {
      type: String,
      default: null,
    },
    orderInfo: {
      type: String,
      default: null,
    },
    orderType: {
      type: String,
      default: "other",
    },
    locale: {
      type: String,
      default: "vn",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ userId: 1 });
PaymentSchema.index({ walletId: 1 });
// Note: transactionRef index is automatically created by unique: true
PaymentSchema.index({ vnpTxnRef: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model<IPayment>("Payment", PaymentSchema);
