import mongoose, { Schema, Document } from "mongoose";
import { PlatformStatus } from "@/types";

export interface IPlatformCatalog extends Document {
  platformName: string;
  logoUrl?: string | null;
  status: PlatformStatus;
  createdAt: Date;
}

const PlatformCatalogSchema = new Schema<IPlatformCatalog>(
  {
    platformName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Hidden"],
      default: "Active",
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
PlatformCatalogSchema.index({ status: 1 });

export default mongoose.model<IPlatformCatalog>(
  "PlatformCatalog",
  PlatformCatalogSchema
);
