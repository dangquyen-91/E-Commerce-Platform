// Role Types
export type RoleKey = "CUSTOMER" | "SELLER" | "ADMIN" | "MODERATOR";
export type RoleStatus = "Active" | "Hidden";

// User Types
export type UserStatus = "Active" | "Locked" | "Banned";
// TrustLevel is a number (0-100), no need for type alias

// Shop Types
export type ShopStatus = "Pending" | "Active" | "Suspended" | "Closed";
export type PayoutMethod = "Bank" | "Momo" | "Vnpay" | "Zalopay";

// Product Types
export type ProductStatus = "Pending" | "Approved" | "Rejected" | "Hidden";
export type PlanType = "Personal" | "Family" | "Slot" | "Shared" | "InviteLink";

// Inventory Types
export type SecretType = "Account" | "InviteLink" | "Code" | "QR";
export type InventoryStatus = "Available" | "Reserved" | "Delivered" | "Revoked";

// Order Types
export type OrderStatus =
  | "PendingPayment"
  | "Paid"
  | "Completed"
  | "Cancelled"
  | "Disputed"
  | "Refunded";

export type OrderItemStatus =
  | "WaitingDelivery"
  | "Delivered"
  | "Completed"
  | "Disputed"
  | "Refunded";

export type HoldStatus = "Holding" | "Released" | "Refunded";
export type DeliveryMethod = "Account" | "InviteLink" | "Code" | "QR";
export type PaymentProvider = "Wallet" | "Momo" | "Vnpay" | "Zalopay";

// Wallet Types
export type WalletTxnType =
  | "Topup"
  | "Purchase"
  | "Hold"
  | "Release"
  | "Refund"
  | "Adjustment";

export type WalletTxnRefType = "Order" | "OrderItem" | "Ticket" | "System";
export type WalletTxnDirection = "In" | "Out";

// Support Ticket Types
export type TicketStatus =
  | "PENDING_SELLER"
  | "SELLER_APPROVED"
  | "SELLER_REJECTED"
  | "AUTO_ESCALATED"
  | "MODERATOR_REVIEW"
  | "RESOLVED_REFUNDED"
  | "CLOSED_REJECTED"
  | "APPEAL_FILED"
  | "APPEAL_REVIEW"
  | "APPEAL_CLOSED";

export type TicketType = "Complaint" | "Dispute" | "General" | "Appeal";

export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";

export type ResolutionType =
  | "None"
  | "FullRefund"
  | "PartialRefund"
  | "Replace"
  | "Reject";

// Complaint Category Types
export type ComplaintCategory =
  | "ProductQuality"
  | "NotAsDescribed"
  | "MissingWrongItems"
  | "DeliveryIssues"
  | "AccountNotWorking"
  | "SellerNotResponding"
  | "RefundDispute";

export type ComplaintSubcategory =
  | "ItemDefective"
  | "ItemDamaged"
  | "DifferentFromPhoto"
  | "DifferentSpecifications"
  | "MissingItems"
  | "WrongItems"
  | "NeverDelivered"
  | "PartialDelivery"
  | "CredentialsInvalid"
  | "AccountExpired"
  | "AccountAlreadyUsed"
  | "NoResponse48h"
  | "RefuseRefund"
  | "PartialRefundDispute";

export type EscalationLevel =
  | "Level2_Moderator"
  | "Level3_SeniorMod"
  | "Level4_Admin";

export type ComplaintQueueStatus =
  | "InQueue"
  | "Assigned"
  | "InProgress"
  | "Completed";

export type PenaltyType =
  | "Warning"
  | "TemporarySuspension"
  | "PermanentSuspension"
  | "Fine";

export type EvidenceType = "Image" | "Video" | "Screenshot" | "Document";

export type ComplaintEventType =
  | "Created"
  | "SellerNotified"
  | "SellerResponded"
  | "SellerTimeout"
  | "EvidenceAdded"
  | "BuyerAccepted"
  | "BuyerRejected"
  | "EscalatedToMod"
  | "AddedToQueue"
  | "ModeratorAssigned"
  | "StatusChanged"
  | "InternalNoteAdded"
  | "InfoRequested"
  | "InfoProvided"
  | "DecisionMade"
  | "AppealFiled"
  | "AppealResolved"
  | "PenaltyIssued"
  | "RefundProcessed"
  | "Closed";

export type ComplaintActorRole =
  | "BUYER"
  | "SELLER"
  | "MODERATOR"
  | "SENIOR_MOD"
  | "ADMIN"
  | "SYSTEM";

export type AppealDecision = "Upheld" | "Overturned";

// Complaint Evidence Interface
export interface IComplaintEvidence {
  _id?: string;
  uploadedBy: string;
  type: EvidenceType;
  url: string;
  description?: string;
  uploadedAt: Date;
}

// Internal Note Interface
export interface IInternalNote {
  _id?: string;
  authorUserId: string;
  content: string;
  createdAt: Date;
}

// Seller Penalty Interface
export interface ISellerPenalty {
  type: PenaltyType;
  reason: string;
  issuedAt: Date;
  issuedByUserId: string;
  duration?: number; // days for suspension
  amount?: number; // VND for fine
}

// Order Snapshot Interface (for complaint context)
export interface IOrderSnapshot {
  orderId: string;
  orderCode: string;
  totalAmount: number;
  paidAt: Date;
  productTitle: string;
  productThumbnail?: string;
  deliveryContent?: string; // Masked
  deliveredAt?: Date;
}

// Review Types
export type ReviewStatus = "Visible" | "Hidden";

// Report Types
export type ReportTargetType = "Product" | "Review" | "Shop" | "User";
export type ReportReason =
  | "Fraud"
  | "Spam"
  | "Illegal"
  | "Harassment"
  | "Other";

export type ReportStatus = "Open" | "InReview" | "Resolved" | "Rejected";
export type ReportActionType =
  | "None"
  | "HideProduct"
  | "HideReview"
  | "SuspendShop"
  | "BanUser"
  | "RejectReport";

// Conversation Types
export type ConversationType = "OrderItem" | "Shop" | "Support";
export type ConversationStatus = "Open" | "Closed" | "Blocked";

// Message Types
export type MessageType = "Text" | "System" | "Attachment";
export type AttachmentType = "Image" | "File" | "None";

// Audit Log Types
export type AuditActorRoleKey =
  | "CUSTOMER"
  | "SELLER"
  | "ADMIN"
  | "MODERATOR"
  | "SYSTEM";

export type AuditEntityType =
  | "User"
  | "Shop"
  | "Product"
  | "Order"
  | "OrderItem"
  | "Ticket"
  | "Review"
  | "Report"
  | "Wallet"
  | "InventoryItem"
  | "Conversation"
  | "Message"
  | "System";

export type AuditSeverity = "Info" | "Warn" | "Critical";

// Platform Catalog Types
export type PlatformStatus = "Active" | "Hidden";

// Socket Event Types
export type SocketReviewEventType = "review:created" | "review:updated" | "review:deleted";

export interface SocketReviewPayload {
  reviewId: string;
  productId: string;
  shopId: string;
  userId?: string;
  rating?: number;
  comment?: string;
  images?: string[];
  productRatingAvg?: number;
  productReviewCount?: number;
  shopRatingAvg?: number;
  sellerReply?: string;
  sellerReplyAt?: Date;
}

// Chat Socket Event Types
export type SocketChatEventType =
  | "message:new"
  | "message:read"
  | "message:deleted"
  | "conversation:updated"
  | "conversation:closed"
  | "typing:start"
  | "typing:stop";

export type SocketTicketEventType =
  | "ticket:created"
  | "ticket:updated"
  | "ticket:assigned"
  | "ticket:escalated"
  | "ticket:resolved";

export interface SocketMessagePayload {
  messageId: string;
  conversationId: string;
  senderUserId: string;
  senderName?: string;
  messageType: MessageType;
  body?: string;
  attachments?: Array<{
    url: string;
    type: AttachmentType;
    fileName?: string;
  }>;
  isInternal?: boolean;
  sentAt: Date;
}

export interface SocketConversationPayload {
  conversationId: string;
  status?: ConversationStatus;
  lastMessagePreview?: string;
  lastMessageAt?: Date;
  unreadCount?: { [userId: string]: number };
}

export interface SocketTicketPayload {
  ticketId: string;
  ticketCode: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string;
  customerUserId?: string;
}

// Complaint Socket Event Types
export type SocketComplaintEventType =
  | "complaint:created"
  | "complaint:seller_notified"
  | "complaint:seller_responded"
  | "complaint:seller_timeout"
  | "complaint:buyer_accepted"
  | "complaint:buyer_rejected"
  | "complaint:escalated"
  | "complaint:added_to_queue"
  | "complaint:assigned"
  | "complaint:status_changed"
  | "complaint:evidence_added"
  | "complaint:info_requested"
  | "complaint:decision_made"
  | "complaint:appeal_filed"
  | "complaint:appeal_resolved"
  | "complaint:deadline_warning"
  | "complaint:closed";

export interface SocketComplaintPayload {
  ticketId: string;
  ticketCode: string;
  status?: TicketStatus;
  escalationLevel?: EscalationLevel;
  category?: ComplaintCategory;
  buyerUserId: string;
  sellerUserId?: string;
  shopId?: string;
  assignedModeratorId?: string;
  resolutionType?: ResolutionType;
  hoursRemaining?: number;
  message?: string;
}

// Complaint Configuration Constants
export const COMPLAINT_CONFIG = {
  SELLER_RESPONSE_HOURS: 24,
  APPEAL_WINDOW_HOURS: 72,
  HIGH_VALUE_THRESHOLD: 1000000, // 1M VND
  LOW_TRUST_THRESHOLD: 30,

  PRIORITY_WEIGHTS: {
    orderValue: 0.3,
    buyerTrust: 0.15,
    sellerTrust: 0.15,
    ticketAge: 0.25,
    isHighValue: 0.15,
  },

  SLA_TARGETS: {
    firstResponse: 120, // 2 hours in minutes
    resolution: 2880, // 48 hours in minutes
  },

  REMINDER_HOURS: [24, 12, 6],
} as const;
