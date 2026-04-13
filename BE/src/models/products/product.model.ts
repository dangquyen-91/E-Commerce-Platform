import mongoose, { Schema, Document } from "mongoose";
import { ProductStatus, PlanType } from "@/types";

export interface IProduct extends Document {
  shopId: mongoose.Types.ObjectId;
  platformId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  warrantyPolicy: string;
  howToUse: string;
  thumbnailUrl?: string | null;
  planType: PlanType;
  durationDays: number;
  price: number; // VND
  status: ProductStatus;
  approvedByUserId?: mongoose.Types.ObjectId | null; // MODERATOR
  approvedAt?: Date | null;
  rejectionReason?: string | null;
  ratingAvg: number; // 0-5, average rating
  reviewCount: number; // Total visible reviews
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    platformId: {
      type: Schema.Types.ObjectId,
      ref: "PlatformCatalog",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    warrantyPolicy: {
      type: String,
      required: true,
    },
    howToUse: {
      type: String,
      required: true,
    },
    thumbnailUrl: {
      type: String,
      default: null,
    },
    planType: {
      type: String,
      required: true,
      enum: ["Personal", "Family", "Slot", "Shared", "InviteLink"],
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Approved", "Rejected", "Hidden"],
      default: "Pending",
    },
    approvedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User", // MODERATOR
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
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
ProductSchema.index({ shopId: 1 });
ProductSchema.index({ platformId: 1 });
ProductSchema.index({ status: 1 });
ProductSchema.index({ isDeleted: 1 });
ProductSchema.index({ createdAt: -1 });

export default mongoose.model<IProduct>("Product", ProductSchema);
