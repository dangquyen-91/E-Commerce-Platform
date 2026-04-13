// Domain types for Complaints module
// Source of truth: BE/swagger.yml (OpenAPI)

export type EvidenceType = "Image" | "Video" | "Screenshot" | "Document";

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

export type ResolutionType = "None" | "FullRefund" | "PartialRefund" | "Replace" | "Reject";

export type PenaltyType = "Warning" | "TemporarySuspension" | "PermanentSuspension" | "Fine";

export type ComplaintStatus =
  | "ModeratorAssigned"
  | "InReview"
  | "NeedMoreInfo"
  | "DecisionMade"
  | "Appealable"
  | "AppealFiled"
  | "AppealReview"
  | "Resolved"
  | "Closed"
  | "PENDING_SELLER"
  | "SELLER_APPROVED"
  | "SELLER_REJECTED"
  | "AUTO_ESCALATED"
  | "MODERATOR_REVIEW"
  | "RESOLVED_REFUNDED"
  | "CLOSED_REJECTED";

export type EscalationLevel = "Level2_Moderator" | "Level3_SeniorMod" | "Level4_Admin";

export type ComplaintQueueStatus = "InQueue" | "Assigned" | "InProgress" | "Completed";

export type TimelineActorRole = "BUYER" | "SELLER" | "MODERATOR" | "ADMIN" | "SYSTEM";

export type TimelineEventType =
  | "Created"
  | "SellerNotified"
  | "SellerResponded"
  | "SellerTimeout"
  | "EvidenceAdded"
  | "BuyerAccepted"
  | "BuyerRejected"
  | "Escalated"
  | "AutoEscalated"
  | "AssignedToModerator"
  | "InternalNoteAdded"
  | "InfoRequested"
  | "InfoProvided"
  | "DecisionMade"
  | "AppealFiled"
  | "AppealDecisionMade"
  | "Resolved"
  | "Closed"
  | "StatusChanged"
  | "PriorityChanged";

export interface UserBasic {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string | null;
}

export interface ShopBasic {
  _id: string;
  shopName?: string;
  name?: string;
  logo?: string | null;
}

export interface ComplaintEvidence {
  type: EvidenceType;
  url: string;
  description?: string;
  uploadedAt: string; // date-time
}

export interface Complaint {
  _id: string;
  ticketCode: string;

  customerUserId: string | UserBasic;
  sellerUserId: string | UserBasic;
  shopId: string | ShopBasic;

  orderItemId: string;

  category: ComplaintCategory;
  subcategory?: ComplaintSubcategory;

  title: string;
  content: string;

  status: ComplaintStatus;
  priority: "Low" | "Medium" | "High" | "Urgent";
  escalationLevel: EscalationLevel;

  buyerEvidence: ComplaintEvidence[];
  sellerEvidence?: ComplaintEvidence[];

  assignedToUserId?: (string | UserBasic) | null;

  resolutionType: ResolutionType;
  refundAmount?: number | null;

  sellerResponseNote?: string | null;
  decisionNote?: string | null;
  decidedByUserId?: string | null;
  decidedAt?: string | null;

  isAppeal: boolean;
  originalTicketId?: string | null;
  appealDeadline?: string | null;

  orderValue: number;
  isHighValue: boolean;
  calculatedPriority: number;
  slaBreached: boolean;
  firstResponseAt?: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ComplaintQueueItem {
  _id: string;
  ticketId: string | Complaint;
  assignedModeratorId?: (string | UserBasic) | null;

  queuePriority: number;
  status: ComplaintQueueStatus;

  addedToQueueAt: string;
  pickedUpAt?: string | null;
  completedAt?: string | null;

  orderValue: number;
  buyerTrustLevel: number;
  sellerTrustLevel: number;
  ticketAge: number;

  isHighValue: boolean;
  isEscalated: boolean;
}

export interface ComplaintTimelineEvent {
  _id: string;
  ticketId: string;
  eventType: TimelineEventType;
  actorUserId: string | UserBasic;
  actorRole: TimelineActorRole;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Pagination {
  total: number;
  limit: number;
  skip: number;
}

export interface ListResponse<T> {
  success: boolean;
  data?: T[];
  pagination?: Pagination;
}

export interface DetailResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface QueueStats {
  totalInQueue: number;
  totalAssigned: number;
  totalInProgress: number;
  totalCompletedToday: number;
  avgWaitTimeMinutes: number;
  highValueCount: number;
}

export interface ModeratorWorkloadItem {
  moderatorId: string;
  moderatorName: string;
  assignedCount: number;
  inProgressCount: number;
  completedTodayCount: number;
}

export type ModeratorWorkloadResponse = {
  success: boolean;
  data?: ModeratorWorkloadItem[];
};

// ===== Requests =====

export interface CreateComplaintRequest {
  orderItemId: string;
  category: ComplaintCategory;
  subcategory?: ComplaintSubcategory;
  title: string;
  content: string;
  evidence?: Array<{ type: EvidenceType; url: string; description?: string }>;
}

// NOTE: swagger AddEvidenceRequest is NOT wrapped in {evidence: []}; it is a single evidence item.
export interface AddEvidenceRequest {
  type: EvidenceType;
  url: string;
  description?: string;
}

export interface AddInternalNoteRequest {
  content: string;
}

export interface RequestInfoRequest {
  targetParty: "buyer" | "seller" | "both";
  questions: string[];
}

export interface SellerDecisionRequest {
  decision: "APPROVE" | "REJECT";
  note?: string;
  evidence?: Array<{ type: EvidenceType; url: string; description?: string }>;
}

export interface MakeDecisionRequest {
  resolutionType: ResolutionType;
  decisionNote: string;
  templateId?: string;
  refundAmount?: number;
  sellerPenalty?: {
    type: PenaltyType;
    reason: string;
    duration?: number;
    amount?: number;
  };
}

export interface FileAppealRequest {
  reason: string;
  additionalEvidence?: Array<{ type: EvidenceType; url: string; description?: string }>;
}

export interface AppealDecisionRequest {
  decision: "Upheld" | "Overturned";
  newResolutionType?: ResolutionType;
  newRefundAmount?: number;
  reason: string;
}

export interface AssignRequest {
  moderatorId?: string;
}

export interface CheckCanFileResponse {
  canFile: boolean;
  reason: string | null;
}
