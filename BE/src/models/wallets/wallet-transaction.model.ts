import mongoose, { Schema, Document } from "mongoose";
import {
  WalletTxnType,
  WalletTxnRefType,
  WalletTxnDirection,
} from "@/types";

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  type: WalletTxnType;
  refType?: WalletTxnRefType | null;
  refId?: mongoose.Types.ObjectId | null;
  direction: WalletTxnDirection;
  amount: number; // VND
  note?: string | null;
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Topup", "Purchase", "Hold", "Release", "Refund", "Adjustment"],
    },
    refType: {
      type: String,
      enum: ["Order", "OrderItem", "Ticket", "System"],
      default: null,
    },
    refId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    direction: {
      type: String,
      required: true,
      enum: ["In", "Out"],
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
WalletTransactionSchema.index({ walletId: 1 });
WalletTransactionSchema.index({ type: 1 });
WalletTransactionSchema.index({ refType: 1, refId: 1 });
WalletTransactionSchema.index({ createdAt: -1 });

export default mongoose.model<IWalletTransaction>(
  "WalletTransaction",
  WalletTransactionSchema
);
