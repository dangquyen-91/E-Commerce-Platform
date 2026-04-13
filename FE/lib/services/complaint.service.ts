import { complaintsApi } from "../domains/complaints/complaints.api";
import * as T from "../domains/complaints/complaints.types";

// Re-export types for backward compatibility where possible, 
// but mapping to the new truth from complaints.types.ts
export type {
  Complaint,
  ComplaintCategory,
  ComplaintSubcategory,
  ComplaintEvidence,
  EvidenceType,
  ComplaintQueueItem,
  QueueStats as ComplaintQueueStats,
  ComplaintTimelineEvent as ComplaintTimeline,
} from "../domains/complaints/complaints.types";

export type ComplaintResolution = T.ResolutionType;
export type AppealDecision = "Upheld" | "Overturned";

// Request types - kept for backward compatibility with existing components
export interface CreateComplaintRequest {
  orderItemId: string;
  title: string;
  content: string;
  category: T.ComplaintCategory;
  subcategory?: T.ComplaintSubcategory;
  evidence?: {
    type: T.EvidenceType;
    url: string;
    description?: string;
  }[];
}

export interface AddEvidenceRequest {
  evidence: {
    type: T.EvidenceType;
    url: string;
    description?: string;
  }[];
}

export interface FileAppealRequest {
  reason: string;
  evidence?: {
    type: T.EvidenceType;
    url: string;
    description?: string;
  }[];
}

export interface RequestInfoRequest {
  targetParty: "buyer" | "seller" | "both";
  questions: string[];
}

export interface MakeDecisionRequest {
  resolution: T.ResolutionType;
  reason: string;
  refundAmount?: number;
}

export interface AppealDecisionRequest {
  decision: AppealDecision;
  note?: string;
}

export interface SellerDecisionRequest {
  decision: "APPROVE" | "REJECT";
  note?: string;
  evidence?: {
    type: T.EvidenceType;
    url: string;
    description?: string;
  }[];
}

export interface ComplaintFilter {
  status?: string;
  category?: string;
  limit?: number;
  skip?: number;
}

export interface QueueFilter {
  status?: string;
  priority?: "high" | "normal"; // Deprecated in swagger, but kept for types
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  limit?: number;
  skip?: number;
}

// Response types
export interface ComplaintsResponse {
  tickets: T.Complaint[];
  total: number;
}

export interface QueueResponse {
  items: T.ComplaintQueueItem[];
  total: number;
}

export interface CanFileComplaintResponse {
  canFile: boolean;
  reason?: string;
  existingTicketId?: string;
}

class ComplaintService {
  // ===== Buyer Endpoints =====

  /**
   * Create a new complaint
   * Wrapped to use complaintsApi.create
   */
  async createComplaint(data: CreateComplaintRequest): Promise<T.Complaint> {
    const res = await complaintsApi.create({
      orderItemId: data.orderItemId,
      category: data.category,
      subcategory: data.subcategory,
      title: data.title,
      content: data.content,
      evidence: data.evidence,
    });
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Add evidence to complaint
   * Wrapped to use complaintsApi.addEvidence
   * Note: Old FE passed evidence[], Swagger takes single object. 
   * We've updated to take the first one or loop if needed.
   */
  async addEvidence(complaintId: string, data: AddEvidenceRequest): Promise<T.Complaint> {
    if (!data.evidence || data.evidence.length === 0) {
      throw new Error("No evidence provided");
    }
    // Taking the first one as per swagger single-object definition
    const res = await complaintsApi.addEvidence(complaintId, data.evidence[0]);
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * File an appeal
   * Wrapped to use complaintsApi.fileAppeal
   */
  async fileAppeal(complaintId: string, data: FileAppealRequest): Promise<T.Complaint> {
    const res = await complaintsApi.fileAppeal(complaintId, {
      reason: data.reason,
      additionalEvidence: data.evidence,
    });
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Get my complaints (customer)
   * Wrapped to use complaintsApi.getMyComplaints
   */
  async getMyComplaints(filter: ComplaintFilter = {}): Promise<ComplaintsResponse> {
    const res = await complaintsApi.getMyComplaints({
      status: filter.status,
      limit: filter.limit,
      skip: filter.skip,
    });
    return {
      tickets: res.data ?? [],
      total: res.pagination?.total || (res.data?.length ?? 0),
    };
  }

  /**
   * Get complaints for seller's own shop/orders
   */
  async getSellerComplaints(filter: ComplaintFilter = {}): Promise<ComplaintsResponse> {
    const res = await complaintsApi.getSellerComplaints({
      status: filter.status,
      limit: filter.limit,
      skip: filter.skip,
    });
    return {
      tickets: res.data ?? [],
      total: res.pagination?.total || (res.data?.length ?? 0),
    };
  }

  /**
   * Seller decision on complaint
   */
  async sellerDecision(complaintId: string, data: SellerDecisionRequest): Promise<T.Complaint> {
    const res = await complaintsApi.sellerDecision(complaintId, data);
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Check if can file complaint
   * Wrapped to use complaintsApi.checkCanFile
   */
  async checkCanFileComplaint(orderItemId: string): Promise<CanFileComplaintResponse> {
    const res = await complaintsApi.checkCanFile(orderItemId);
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return {
      canFile: res.data.canFile,
      reason: res.data.reason || undefined,
    };
  }

  // ===== Moderator Endpoints =====

  /**
   * Get complaint queue
   * Wrapped to use complaintsApi.getQueue
   */
  async getQueue(filter: QueueFilter = {}): Promise<QueueResponse> {
    const res = await complaintsApi.getQueue({
      status: filter.status as T.ComplaintQueueStatus,
      sortBy: filter.sortBy,
      sortOrder: filter.sortOrder,
      limit: filter.limit,
      skip: filter.skip,
    });
    return {
      items: res.data ?? [],
      total: res.pagination?.total || (res.data?.length ?? 0),
    };
  }

  /**
   * Get queue statistics
   * Wrapped to use complaintsApi.getQueueStats
   */
  async getQueueStats(): Promise<T.QueueStats> {
    const res = await complaintsApi.getQueueStats();
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }


  /**
   * Assign complaint to moderator
   */
  async assignToModerator(
    complaintId: string,
    moderatorId?: string
  ): Promise<T.Complaint> {
    const res = await complaintsApi.assign(complaintId, { moderatorId });
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Add internal note
   */
  async addInternalNote(complaintId: string, content: string): Promise<T.Complaint> {
    const res = await complaintsApi.addInternalNote(complaintId, { content });
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Request more information
   */
  async requestMoreInfo(
    complaintId: string,
    data: RequestInfoRequest
  ): Promise<T.Complaint> {
    const res = await complaintsApi.requestInfo(complaintId, data);
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Make decision on complaint
   */
  async makeDecision(
    complaintId: string,
    data: MakeDecisionRequest
  ): Promise<T.Complaint> {
    const res = await complaintsApi.makeDecision(complaintId, {
      resolutionType: data.resolution,
      decisionNote: data.reason,
      refundAmount: data.refundAmount,
    });
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Get moderator workload
   */
  async getModeratorWorkload(): Promise<T.ModeratorWorkloadItem[]> {
    const res = await complaintsApi.getModeratorWorkload();
    return res.data ?? [];
  }

  // ===== Admin Endpoints =====

  /**
   * Resolve appeal
   */
  async resolveAppeal(
    complaintId: string,
    data: AppealDecisionRequest
  ): Promise<T.Complaint> {
    const res = await complaintsApi.resolveAppeal(complaintId, {
      decision: data.decision,
      reason: data.note || "No reason provided",
    });
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  // ===== Common Endpoints =====

  /**
   * Get complaint by ID
   */
  async getComplaintById(complaintId: string): Promise<T.Complaint> {
    const res = await complaintsApi.getById(complaintId);
    if (!res.data) {
      throw new Error("Empty response data");
    }
    return res.data;
  }

  /**
   * Get complaint timeline
   */
  async getComplaintTimeline(complaintId: string): Promise<T.ComplaintTimelineEvent[]> {
    const res = await complaintsApi.getTimeline(complaintId);
    return res.data ?? [];
  }

  /**
   * Get all complaints (admin/moderator)
   */
  async getAllComplaints(filter: ComplaintFilter = {}): Promise<ComplaintsResponse> {
    const res = await complaintsApi.getAll({
      status: filter.status,
      category: filter.category as T.ComplaintCategory,
      limit: filter.limit,
      skip: filter.skip,
    });
    return {
      tickets: res.data ?? [],
      total: res.pagination?.total || (res.data?.length ?? 0),
    };
  }
}

export const complaintService = new ComplaintService();