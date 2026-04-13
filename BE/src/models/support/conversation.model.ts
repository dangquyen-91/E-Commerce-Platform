import mongoose, { Schema, Document } from "mongoose";
import { ConversationType, ConversationStatus } from "@/types";

export interface IConversationUnreadCount {
  [userId: string]: number;
}

export interface IConversation extends Document {
  type: ConversationType;
  customerUserId: mongoose.Types.ObjectId;
  sellerUserId?: mongoose.Types.ObjectId | null;
  staffUserId?: mongoose.Types.ObjectId | null; // MODERATOR/ADMIN
  shopId?: mongoose.Types.ObjectId | null;
  orderItemId?: mongoose.Types.ObjectId | null;
  ticketId?: mongoose.Types.ObjectId | null; // Reference to support_tickets._id
  status: ConversationStatus;
  lastMessageAt?: Date | null;
  lastMessagePreview?: string | null; // Preview of last message (truncated)
  unreadCount: IConversationUnreadCount; // { [userId]: count }
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    type: {
      type: String,
      required: true,
      enum: ["OrderItem", "Shop", "Support"],
    },
    customerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    staffUserId: {
      type: Schema.Types.ObjectId,
      ref: "User", // MODERATOR/ADMIN
      default: null,
    },
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    orderItemId: {
      type: Schema.Types.ObjectId,
      ref: "OrderItem",
      default: null,
    },
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["Open", "Closed", "Blocked"],
      default: "Open",
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastMessagePreview: {
      type: String,
      default: null,
      maxlength: 100, // Truncate preview
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ConversationSchema.index({ customerUserId: 1 });
ConversationSchema.index({ sellerUserId: 1 });
ConversationSchema.index({ type: 1 });
ConversationSchema.index({ status: 1 });

export default mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
