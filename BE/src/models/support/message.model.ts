import mongoose, { Schema, Document } from "mongoose";
import { MessageType, AttachmentType } from "@/types";

export interface IMessageAttachment {
  url: string;
  type: AttachmentType;
  fileName?: string;
  fileSize?: number; // bytes
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderUserId: mongoose.Types.ObjectId;
  messageType: MessageType;
  body?: string | null;
  attachmentUrl?: string | null; // Legacy single attachment
  attachmentType: AttachmentType;
  attachments: IMessageAttachment[]; // Multiple attachments support
  isInternal: boolean; // Staff-only internal notes
  sentAt: Date;
  readAt?: Date | null;
  readBy: mongoose.Types.ObjectId[]; // Track multiple readers
  isDeleted: boolean;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageType: {
      type: String,
      required: true,
      enum: ["Text", "System", "Attachment"],
    },
    body: {
      type: String,
      default: null,
    },
    attachmentUrl: {
      type: String,
      default: null,
    },
    attachmentType: {
      type: String,
      required: true,
      enum: ["Image", "File", "None"],
      default: "None",
    },
    attachments: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["Image", "File", "None"], required: true },
        fileName: { type: String },
        fileSize: { type: Number },
      },
    ],
    isInternal: {
      type: Boolean,
      default: false, // Staff-only internal notes
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
  }
);

// Indexes
MessageSchema.index({ conversationId: 1 });
MessageSchema.index({ senderUserId: 1 });
MessageSchema.index({ sentAt: -1 });
MessageSchema.index({ isDeleted: 1 });
MessageSchema.index({ isInternal: 1 });
MessageSchema.index({ conversationId: 1, sentAt: -1 }); // For message history queries

export default mongoose.model<IMessage>("Message", MessageSchema);
