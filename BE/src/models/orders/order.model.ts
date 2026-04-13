import mongoose, { Schema, Document } from "mongoose";
import { OrderStatus, PaymentProvider } from "@/types";

export interface IOrder extends Document {
  orderCode: string;
  customerUserId: mongoose.Types.ObjectId;
  totalAmount: number; // VND
  feeAmount: number; // VND
  payableAmount: number; // VND
  status: OrderStatus;
  paymentProvider?: PaymentProvider | null;
  providerTxnId?: string | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
    },
    customerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    feeAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    payableAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "PendingPayment",
        "Paid",
        "Completed",
        "Cancelled",
        "Disputed",
        "Refunded",
      ],
      default: "PendingPayment",
    },
    paymentProvider: {
      type: String,
      enum: ["Wallet", "Momo", "Vnpay", "Zalopay"],
      default: null,
    },
    providerTxnId: {
      type: String,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: orderCode index is automatically created by unique: true
OrderSchema.index({ customerUserId: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
