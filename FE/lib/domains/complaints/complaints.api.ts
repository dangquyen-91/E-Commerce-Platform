/**
 * Complaints API Domain
 * Refined implementation based on BE/swagger.yml
 */

import { apiClient } from "../../api";
import type { ApiResponse } from "../../api";
import * as T from "./complaints.types";

export const complaintsApi = {
  // ===== Buyer Endpoints =====

  /**
   * Tạo khiếu nại mới (Buyer)
   * POST /api/complaints
   */
  async create(data: T.CreateComplaintRequest): Promise<ApiResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>("/complaints", data);
  },

  /**
   * Lấy khiếu nại của tôi (Buyer)
   * GET /api/complaints/me
   */
  async getMyComplaints(params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<T.ListResponse<T.Complaint>> {
    return await apiClient.get<T.Complaint[]>("/complaints/me", { params });
  },

  /**
   * Lấy khiếu nại của shop tôi (Seller)
   * GET /api/complaints/seller/me
   */
  async getSellerComplaints(params?: {
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<T.ListResponse<T.Complaint>> {
    return await apiClient.get<T.Complaint[]>("/complaints/seller/me", { params });
  },

  /**
   * Kiểm tra có thể tạo khiếu nại
   * GET /api/complaints/check/{orderItemId}
   */
  async checkCanFile(orderItemId: string): Promise<T.DetailResponse<T.CheckCanFileResponse>> {
    return await apiClient.get<T.CheckCanFileResponse>(`/complaints/check/${orderItemId}`);
  },

  /**
   * Thêm bằng chứng (Buyer)
   * POST /api/complaints/{id}/evidence
   */
  async addEvidence(id: string, evidence: T.AddEvidenceRequest): Promise<T.DetailResponse<T.Complaint>> {
    // Swagger: requestBody is the evidence object directly
    return await apiClient.post<T.Complaint>(`/complaints/${id}/evidence`, evidence);
  },

  /**
   * Nộp kháng cáo (Buyer/Seller)
   * POST /api/complaints/{id}/appeal
   */
  async fileAppeal(id: string, data: T.FileAppealRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/appeal`, data);
  },

  /**
   * Seller phản hồi khiếu nại
   * POST /api/complaints/{id}/seller-decision
   */
  async sellerDecision(id: string, data: T.SellerDecisionRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/seller-decision`, data);
  },

  // ===== Moderator Endpoints =====

  /**
   * Lấy danh sách khiếu nại được gán (Moderator)
   * GET /api/complaints/queue
   */
  async getQueue(params?: {
    status?: T.ComplaintQueueStatus;
    isHighValue?: "true" | "false";
    assignedModeratorId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    skip?: number;
  }): Promise<T.ListResponse<T.ComplaintQueueItem>> {
    return await apiClient.get<T.ComplaintQueueItem[]>("/complaints/queue", { params });
  },

  /**
   * Lấy thống kê khiếu nại (Moderator)
   * GET /api/complaints/queue/stats
   */
  async getQueueStats(): Promise<T.DetailResponse<T.QueueStats>> {
    return await apiClient.get<T.QueueStats>("/complaints/queue/stats");
  },

  /**
   * Gán khiếu nại cho Moderator
   * POST /api/complaints/{id}/assign
   */
  async assign(id: string, data?: T.AssignRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/assign`, data);
  },

  /**
   * Thêm ghi chú nội bộ (Moderator)
   * POST /api/complaints/{id}/internal-note
   */
  async addInternalNote(id: string, data: T.AddInternalNoteRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/internal-note`, data);
  },

  /**
   * Yêu cầu thêm thông tin (Moderator)
   * POST /api/complaints/{id}/request-info
   */
  async requestInfo(id: string, data: T.RequestInfoRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/request-info`, data);
  },

  /**
   * Đưa ra quyết định (Moderator)
   * POST /api/complaints/{id}/decision
   */
  async makeDecision(id: string, data: T.MakeDecisionRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/decision`, data);
  },

  // ===== Admin Endpoints =====

  /**
   * Lấy tất cả khiếu nại (Admin/Moderator)
   * GET /api/complaints
   */
  async getAll(params?: {
    status?: string;
    category?: T.ComplaintCategory;
    priority?: string;
    escalationLevel?: T.EscalationLevel;
    assignedToUserId?: string;
    isHighValue?: "true" | "false";
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    limit?: number;
    skip?: number;
  }): Promise<T.ListResponse<T.Complaint>> {
    return await apiClient.get<T.Complaint[]>("/complaints", { params });
  },

  /**
   * Lấy workload của moderators (Admin)
   * GET /api/complaints/moderator/workload
   */
  async getModeratorWorkload(): Promise<T.ModeratorWorkloadResponse> {
    return await apiClient.get<T.ModeratorWorkloadItem[]>("/complaints/moderator/workload");
  },

  /**
   * Giải quyết kháng cáo (Admin/Senior Mod)
   * POST /api/complaints/{id}/appeal-decision
   */
  async resolveAppeal(id: string, data: T.AppealDecisionRequest): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.post<T.Complaint>(`/complaints/${id}/appeal-decision`, data);
  },

  // ===== Common Endpoints =====

  /**
   * Lấy chi tiết khiếu nại
   * GET /api/complaints/{id}
   */
  async getById(id: string): Promise<T.DetailResponse<T.Complaint>> {
    return await apiClient.get<T.Complaint>(`/complaints/${id}`);
  },

  /**
   * Lấy timeline khiếu nại
   * GET /api/complaints/{id}/timeline
   */
  async getTimeline(id: string): Promise<T.DetailResponse<T.ComplaintTimelineEvent[]>> {
    return await apiClient.get<T.ComplaintTimelineEvent[]>(`/complaints/${id}/timeline`);
  },
};
