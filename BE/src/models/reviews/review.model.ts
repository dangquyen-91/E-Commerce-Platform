import mongoose, { Schema, Document } from "mongoose";
import { ReviewStatus } from "@/types";

export interface IReview extends Document {
  orderItemId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  shopId: mongoose.Types.ObjectId;
  rating: number; // 1-5
  comment: string;
  images?: string[]; // Max 5 images
  status: ReviewStatus;
  // Seller reply (only once per review)
  sellerReply?: string;
  sellerReplyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    orderItemId: {
      type: Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: "Maximum 5 images allowed",
      },
    },
    status: {
      type: String,
      required: true,
      enum: ["Visible", "Hidden"],
      default: "Visible",
    },
    sellerReply: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    sellerReplyAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ReviewSchema.index({ orderItemId: 1 });
ReviewSchema.index({ productId: 1 });
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ shopId: 1 });
ReviewSchema.index({ status: 1 });
ReviewSchema.index({ productId: 1, status: 1 });
ReviewSchema.index({ shopId: 1, status: 1 });

export default mongoose.model<IReview>("Review", ReviewSchema);
