import mongoose, { Schema, Document } from "mongoose";
import { ShopStatus, PayoutMethod } from "@/types";

export interface IShop extends Document {
  ownerUserId: mongoose.Types.ObjectId;
  shopName: string;
  description?: string | null;
  payoutMethod?: PayoutMethod | null; // Demo-only, có thể bỏ
  payoutAccount?: string | null; // Demo-only, có thể bỏ
  status: ShopStatus;
  approvedByUserId?: mongoose.Types.ObjectId | null; // ADMIN
  approvedAt?: Date | null;
  moderatorNote?: string | null; // Ghi chú từ moderator khi duyệt/từ chối
  ratingAvg: number;
  reviewCount: number;
  responseRate: number; // Phần trăm phản hồi của shop (0-100)
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const ShopSchema = new Schema<IShop>(
  {
    ownerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // 1 user tối đa 1 shop
    },
    shopName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
    },
    payoutMethod: {
      type: String,
      enum: ["Bank", "Momo", "Vnpay", "Zalopay"],
      default: null,
    },
    payoutAccount: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Active", "Suspended", "Closed"],
      default: "Pending",
    },
    approvedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User", // ADMIN
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    moderatorNote: {
      type: String,
      default: null,
      maxlength: 1000,
    },
    ratingAvg: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalSales: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: ownerUserId index is automatically created by unique: true
ShopSchema.index({ status: 1 });
ShopSchema.index({ isDeleted: 1 });

// Conditional unique index: shopName must be unique among Active and Pending shops only
// Shops that are Closed OR soft-deleted can have duplicate names
ShopSchema.index(
  { shopName: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["Active", "Pending"] },
      isDeleted: false,
    },
  }
);

export default mongoose.model<IShop>("Shop", ShopSchema);
