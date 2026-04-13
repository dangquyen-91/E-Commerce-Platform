import mongoose, { Schema, Document } from "mongoose";
import { ComplaintEventType, ComplaintActorRole } from "@/types";

export interface IComplaintTimeline extends Document {
  ticketId: mongoose.Types.ObjectId;
  eventType: ComplaintEventType;
  actorUserId: mongoose.Types.ObjectId;
  actorRole: ComplaintActorRole;
  description: string;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

const ComplaintTimelineSchema = new Schema<IComplaintTimeline>(
  {
    ticketId: {
      type: Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        "Created",
        "SellerNotified",
        "SellerResponded",
        "SellerTimeout",
        "EvidenceAdded",
        "BuyerAccepted",
        "BuyerRejected",
        "EscalatedToMod",
        "AddedToQueue",
        "ModeratorAssigned",
        "StatusChanged",
        "InternalNoteAdded",
        "InfoRequested",
        "InfoProvided",
        "DecisionMade",
        "AppealFiled",
        "AppealResolved",
        "PenaltyIssued",
        "RefundProcessed",
        "Closed",
      ],
    },
    actorUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actorRole: {
      type: String,
      required: true,
      enum: ["BUYER", "SELLER", "MODERATOR", "SENIOR_MOD", "ADMIN", "SYSTEM"],
    },
    description: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
ComplaintTimelineSchema.index({ ticketId: 1, createdAt: -1 });
ComplaintTimelineSchema.index({ actorUserId: 1, createdAt: -1 });
ComplaintTimelineSchema.index({ eventType: 1, createdAt: -1 });

export default mongoose.model<IComplaintTimeline>(
  "ComplaintTimeline",
  ComplaintTimelineSchema
);
