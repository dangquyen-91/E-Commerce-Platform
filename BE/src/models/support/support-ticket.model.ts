import mongoose, { Schema, Document } from "mongoose";
import {
  TicketStatus,
  ResolutionType,
  TicketType,
  TicketPriority,
  ComplaintCategory,
  ComplaintSubcategory,
  EscalationLevel,
  IComplaintEvidence,
  IInternalNote,
  ISellerPenalty,
  IOrderSnapshot,
} from "@/types";

// Sub-schema for Evidence
const ComplaintEvidenceSchema = new Schema<IComplaintEvidence>(
  {
    uploadedBy: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Image", "Video", "Screenshot", "Document"],
    },
    url: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: null,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Sub-schema for Internal Note
const InternalNoteSchema = new Schema<IInternalNote>(
  {
    authorUserId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

// Sub-schema for Seller Penalty
const SellerPenaltySchema = new Schema<ISellerPenalty>(
  {
    type: {
      type: String,
      required: true,
      enum: ["Warning", "TemporarySuspension", "PermanentSuspension", "Fine"],
    },
    reason: {
      type: String,
      required: true,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    issuedByUserId: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // days for suspension
      default: null,
    },
    amount: {
      type: Number, // VND for fine
      default: null,
    },
  },
  { _id: false }
);

// Sub-schema for Order Snapshot
const OrderSnapshotSchema = new Schema<IOrderSnapshot>(
  {
    orderId: {
      type: String,
      required: true,
    },
    orderCode: {
      type: String,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paidAt: {
      type: Date,
      required: true,
    },
    productTitle: {
      type: String,
      required: true,
    },
    productThumbnail: {
      type: String,
      default: null,
    },
    deliveryContent: {
      type: String, // Masked for privacy
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

export interface ISupportTicket extends Document {
  // Basic Info
  ticketCode: string;
  customerUserId: mongoose.Types.ObjectId;
  orderItemId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;

  // Category System
  category?: ComplaintCategory | null;
  subcategory?: ComplaintSubcategory | null;

  // Shop/Seller Info
  shopId?: mongoose.Types.ObjectId | null;
  sellerUserId?: mongoose.Types.ObjectId | null;

  // Evidence System
  buyerEvidence: IComplaintEvidence[];
  sellerEvidence: IComplaintEvidence[];

  // Order Snapshot (NEW)
  orderSnapshot?: IOrderSnapshot | null;

  // Escalation Tracking
  escalationLevel: EscalationLevel;

  // Appeal Mechanism (NEW)
  isAppeal: boolean;
  originalTicketId?: mongoose.Types.ObjectId | null;
  appealTicketId?: mongoose.Types.ObjectId | null;
  appealDeadline?: Date | null;
  appealReason?: string | null;

  // Moderator Workflow (NEW)
  internalNotes: IInternalNote[];
  decisionTemplate?: string | null;

  // Penalty Tracking (NEW)
  sellerPenalty?: ISellerPenalty | null;

  // SLA Tracking (NEW)
  firstResponseAt?: Date | null;
  sellerResponseDeadlineAt?: Date | null;
  sellerRespondedAt?: Date | null;
  sellerResponseNote?: string | null;
  escalatedAt?: Date | null;
  refundProcessedAt?: Date | null;
  slaBreached: boolean;

  // Priority Calculation (NEW)
  orderValue: number;
  buyerTrustLevel: number;
  sellerTrustLevel: number;
  calculatedPriority: number;

  // Existing fields
  assignedToUserId?: mongoose.Types.ObjectId | null;
  resolutionType: ResolutionType;
  refundAmount?: number;
  decidedByUserId?: mongoose.Types.ObjectId | null;
  decisionNote?: string | null;
  decidedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    // Basic Info
    ticketCode: {
      type: String,
      required: true,
      unique: true,
    },
    customerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderItemId: {
      type: Schema.Types.ObjectId,
      ref: "OrderItem",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Complaint", "Dispute", "General", "Appeal"],
      default: "General",
    },
    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      required: true,
      enum: [
        "PENDING_SELLER",
        "SELLER_APPROVED",
        "SELLER_REJECTED",
        "AUTO_ESCALATED",
        "MODERATOR_REVIEW",
        "RESOLVED_REFUNDED",
        "CLOSED_REJECTED",
        "APPEAL_FILED",
        "APPEAL_REVIEW",
        "APPEAL_CLOSED",
      ],
      default: "PENDING_SELLER",
    },

    // Category System (NEW)
    category: {
      type: String,
      enum: [
        "ProductQuality",
        "NotAsDescribed",
        "MissingWrongItems",
        "DeliveryIssues",
        "AccountNotWorking",
        "SellerNotResponding",
        "RefundDispute",
        null,
      ],
      default: null,
    },
    subcategory: {
      type: String,
      enum: [
        "ItemDefective",
        "ItemDamaged",
        "DifferentFromPhoto",
        "DifferentSpecifications",
        "MissingItems",
        "WrongItems",
        "NeverDelivered",
        "PartialDelivery",
        "CredentialsInvalid",
        "AccountExpired",
        "AccountAlreadyUsed",
        "NoResponse48h",
        "RefuseRefund",
        "PartialRefundDispute",
        null,
      ],
      default: null,
    },

    // Shop/Seller Info
    shopId: {
      type: Schema.Types.ObjectId,
      ref: "Shop",
      default: null,
    },
    sellerUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Evidence System
    buyerEvidence: {
      type: [ComplaintEvidenceSchema],
      default: [],
    },
    sellerEvidence: {
      type: [ComplaintEvidenceSchema],
      default: [],
    },

    // Order Snapshot (NEW)
    orderSnapshot: {
      type: OrderSnapshotSchema,
      default: null,
    },

    // Escalation Tracking
    escalationLevel: {
      type: String,
      enum: [
        "Level2_Moderator",
        "Level3_SeniorMod",
        "Level4_Admin",
      ],
      default: "Level2_Moderator",
    },

    // Appeal Mechanism (NEW)
    isAppeal: {
      type: Boolean,
      default: false,
    },
    originalTicketId: {
      type: Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },
    appealTicketId: {
      type: Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },
    appealDeadline: {
      type: Date,
      default: null,
    },
    appealReason: {
      type: String,
      default: null,
    },

    // Moderator Workflow (NEW)
    internalNotes: {
      type: [InternalNoteSchema],
      default: [],
    },
    decisionTemplate: {
      type: String,
      default: null,
    },

    // Penalty Tracking (NEW)
    sellerPenalty: {
      type: SellerPenaltySchema,
      default: null,
    },

    // SLA Tracking (NEW)
    firstResponseAt: {
      type: Date,
      default: null,
    },
    sellerResponseDeadlineAt: {
      type: Date,
      default: null,
    },
    sellerRespondedAt: {
      type: Date,
      default: null,
    },
    escalatedAt: {
      type: Date,
      default: null,
    },
    refundProcessedAt: {
      type: Date,
      default: null,
    },
    slaBreached: {
      type: Boolean,
      default: false,
    },

    // Priority Calculation (NEW)
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
    calculatedPriority: {
      type: Number,
      default: 0,
    },

    // Existing fields
    assignedToUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolutionType: {
      type: String,
      required: true,
      enum: ["None", "FullRefund", "PartialRefund", "Replace", "Reject"],
      default: "None",
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
    sellerResponseNote: {
      type: String,
      default: null,
    },
    decidedByUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decisionNote: {
      type: String,
      default: null,
    },
    decidedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
// Basic indexes
// SupportTicketSchema.index({ ticketCode: 1 }); // auto-created by `unique: true` on ticketCode
SupportTicketSchema.index({ customerUserId: 1 });
SupportTicketSchema.index({ orderItemId: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ priority: 1 });
SupportTicketSchema.index({ type: 1 });
SupportTicketSchema.index({ assignedToUserId: 1 });

// Priority queue index
SupportTicketSchema.index({
  status: 1,
  escalationLevel: 1,
});

// Moderator assignment index
SupportTicketSchema.index({ assignedToUserId: 1, status: 1, createdAt: -1 });

// Shop complaints index
SupportTicketSchema.index({ shopId: 1, status: 1, createdAt: -1 });

// Appeal tracking index
SupportTicketSchema.index({ isAppeal: 1, originalTicketId: 1 });

// SLA monitoring index
SupportTicketSchema.index({ status: 1, createdAt: 1, firstResponseAt: 1 });

// High-value orders index
SupportTicketSchema.index({ orderValue: -1, status: 1 });

// Category reporting index
SupportTicketSchema.index({ category: 1, subcategory: 1, createdAt: -1 });

// Calculated priority queue index
SupportTicketSchema.index({ status: 1, calculatedPriority: -1, createdAt: 1 });

export default mongoose.model<ISupportTicket>(
  "SupportTicket",
  SupportTicketSchema
);
