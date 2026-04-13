import mongoose, { Schema, Document } from "mongoose";
import { SecretType, InventoryStatus } from "@/types";

export interface IInventoryItem extends Document {
  shopId: mongoose.Types.ObjectId;
  platformId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId; // Product gốc khi seller thêm inventory (để tracking)
  secretType: SecretType;
  secretValue: string;
  status: InventoryStatus;
  reservedAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt: Date;
  isDeleted: boolean;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
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
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    secretType: {
      type: String,
      required: true,
      enum: ["Account", "InviteLink", "Code", "QR"],
    },
    secretValue: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Available", "Reserved", "Delivered", "Revoked"],
      default: "Available",
    },
    reservedAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    // Ensure stable pagination + allows FE to display created time
    timestamps: true,
  }
);

// Indexes
InventoryItemSchema.index({ shopId: 1, platformId: 1 }); // Tìm inventory theo pool
InventoryItemSchema.index({ productId: 1 }); // Tracking theo product gốc
InventoryItemSchema.index({ shopId: 1 });
InventoryItemSchema.index({ platformId: 1 });
InventoryItemSchema.index({ status: 1 });
InventoryItemSchema.index({ isDeleted: 1 });

export default mongoose.model<IInventoryItem>(
  "InventoryItem",
  InventoryItemSchema
);
