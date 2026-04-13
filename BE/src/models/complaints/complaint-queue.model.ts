import mongoose, { Schema, Document } from "mongoose";
import { ComplaintQueueStatus } from "@/types";

export interface IComplaintQueue extends Document {
  ticketId: mongoose.Types.ObjectId;
  assignedModeratorId?: mongoose.Types.ObjectId | null;
  queuePriority: number; // Calculated priority score (higher = more urgent)
  estimatedResolutionTime: number; // minutes
  addedToQueueAt: Date;
  pickedUpAt?: Date | null;
  completedAt?: Date | null;
  status: ComplaintQueueStatus;

  // Priority factors (denormalized for query efficiency)
  orderValue: number;
  buyerTrustLevel: number;
  sellerTrustLevel: number;
  ticketAge: number; // hours since creation
  isHighValue: boolean;
  isEscalated: boolean;
  sellerTimeoutOccurred: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ComplaintQueueSchema = new Schema<IComplaintQueue>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      unique: true,
    },
    assignedModeratorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    queuePriority: {
      type: Number,
      required: true,
      default: 0,
    },
    estimatedResolutionTime: {
      type: Number, // minutes
      default: 120, // Default 2 hours
    },
    addedToQueueAt: {
      type: Date,
      default: Date.now,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["InQueue", "Assigned", "InProgress", "Completed"],
      default: "InQueue",
    },

    // Priority factors
    orderValue: {
      type: Number,
      default: 0,
    },
    buyerTrustLevel: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    sellerTrustLevel: {
      type: Number,
      default: 50,
      min: 0,
      max: 100,
    },
    ticketAge: {
      type: Number, // hours
      default: 0,
    },
    isHighValue: {
      type: Boolean,
      default: false,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    sellerTimeoutOccurred: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ComplaintQueueSchema.index({ status: 1, queuePriority: -1 });
ComplaintQueueSchema.index({ assignedModeratorId: 1, status: 1 });
ComplaintQueueSchema.index({ status: 1, addedToQueueAt: 1 });
ComplaintQueueSchema.index({ isHighValue: 1, status: 1, queuePriority: -1 });

export default mongoose.model<IComplaintQueue>(
  "ComplaintQueue",
  ComplaintQueueSchema
);
