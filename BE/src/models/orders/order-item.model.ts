import mongoose, { Schema, Document } from "mongoose";
import {
  OrderItemStatus,
  HoldStatus,
  DeliveryMethod,
} from "@/types";

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  shopId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  inventoryItemId?: mongoose.Types.ObjectId | null;
  quantity: number;
  unitPrice: number; // VND
  subtotal: number; // VND
  itemStatus: OrderItemStatus;
  safeUntil: Date;
  // Escrow/Hold
  holdAmount: number; // VND
  holdStatus: HoldStatus;
  holdAt: Date;
  releaseAt?: Date | null;
  // Delivery evidence
  deliveryMethod?: DeliveryMethod | null;
  deliveryContent?: string | null; // Full content for customer (encrypted at rest recommended)
  deliveryContentMasked?: string | null; // Masked version for display
  evidenceNote?: string | null;
  deliveredAt?: Date | null;
  createdAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: "InventoryItem",
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    itemStatus: {
      type: String,
      required: true,
      enum: [
        "WaitingDelivery",
        "Delivered",
        "Completed",
        "Disputed",
        "Refunded",
      ],
      default: "WaitingDelivery",
    },
    safeUntil: {
      type: Date,
      required: true,
    },
    // Escrow/Hold
    holdAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    holdStatus: {
      type: String,
      required: true,
      enum: ["Holding", "Released", "Refunded"],
      default: "Holding",
    },
    holdAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    releaseAt: {
      type: Date,
      default: null,
    },
    // Delivery evidence
    deliveryMethod: {
      type: String,
      enum: ["Account", "InviteLink", "Code", "QR"],
      default: null,
    },
    deliveryContent: {
      type: String,
      default: null,
    },
    deliveryContentMasked: {
      type: String,
      default: null,
    },
    evidenceNote: {
      type: String,
      default: null,
    },
    deliveredAt: {
      type: Date,
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
OrderItemSchema.index({ orderId: 1 });
OrderItemSchema.index({ shopId: 1 });
OrderItemSchema.index({ productId: 1 });
OrderItemSchema.index({ itemStatus: 1 });
OrderItemSchema.index({ holdStatus: 1 });

export default mongoose.model<IOrderItem>("OrderItem", OrderItemSchema);
