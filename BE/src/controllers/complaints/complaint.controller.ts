import { Response, NextFunction } from "express";
import { complaintService } from "@/services/complaints/complaint.service";
import { complaintQueueService } from "@/services/complaints/complaint-queue.service";
import { AppError } from "@/middleware/errorHandler";
import { AuthRequest } from "@/middleware/auth";
import {
  createComplaintSchema,
  addEvidenceSchema,
  fileAppealSchema,
  addInternalNoteSchema,
  requestInfoSchema,
  makeDecisionSchema,
  sellerDecisionSchema,
  appealDecisionSchema,
  getComplaintsQuerySchema,
  getQueueQuerySchema,
} from "@/validators/complaints/complaint.schema";
import { ComplaintTimeline } from "@/models";

// Helper to safely get string from params
const getParamString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

export class ComplaintController {
  // ===== Buyer Endpoints =====

  /**
   * Create a new complaint - goes directly to moderator queue
   * POST /api/complaints
   */
  createComplaint = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const input = createComplaintSchema.parse(req.body);
      const ticket = await complaintService.createComplaint(userId, input);

      res.status(201).json({
        success: true,
        message: "Tạo khiếu nại thành công. Seller có 24h để phản hồi trước khi chuyển moderator.",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add evidence to complaint
   * POST /api/complaints/:id/evidence
   */
  addEvidence = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const input = addEvidenceSchema.parse(req.body);

      const ticket = await complaintService.addEvidence(id, userId, input);

      res.status(200).json({
        success: true,
        message: "Thêm bằng chứng thành công",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * File an appeal
   * POST /api/complaints/:id/appeal
   */
  fileAppeal = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const input = fileAppealSchema.parse(req.body);

      const appealTicket = await complaintService.fileAppeal(id, userId, input);

      res.status(201).json({
        success: true,
        message: "Đã nộp kháng cáo thành công",
        data: appealTicket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get my complaints
   * GET /api/complaints/me
   */
  getMyComplaints = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const { limit = 20, skip = 0, status } = req.query;

      const tickets = await complaintService.getMyComplaints(userId, {
        limit: Number(limit),
        skip: Number(skip),
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get seller complaints (for own shop/orders)
   * GET /api/complaints/seller/me
   */
  getSellerComplaints = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const { limit = 20, skip = 0, status } = req.query;

      const tickets = await complaintService.getSellerComplaints(userId, {
        limit: Number(limit),
        skip: Number(skip),
        status: status as string,
      });

      res.status(200).json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Seller decision on complaint
   * POST /api/complaints/:id/seller-decision
   */
  sellerDecision = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const input = sellerDecisionSchema.parse(req.body);

      const ticket = await complaintService.sellerDecision(id, userId, input);

      res.status(200).json({
        success: true,
        message: "Seller đã phản hồi khiếu nại",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // ===== Moderator Endpoints =====

  /**
   * Get complaint queue
   * GET /api/complaints/queue
   */
  getQueue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = getQueueQuerySchema.parse(req.query);
      const { items, total } = await complaintQueueService.getQueue(query);

      res.status(200).json({
        success: true,
        data: items,
        pagination: { total, limit: query.limit, skip: query.skip },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get queue statistics
   * GET /api/complaints/queue/stats
   */
  getQueueStats = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await complaintQueueService.getQueueStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Pick next complaint from queue
   * POST /api/complaints/queue/pick
   */
  pickFromQueue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const queueItem = await complaintQueueService.pickNextFromQueue(userId);

      if (!queueItem) {
        res.status(200).json({
          success: true,
          message: "Không có khiếu nại nào trong hàng đợi",
          data: null,
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Đã nhận khiếu nại",
        data: queueItem,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Pick multiple complaints from queue
   * POST /api/complaints/queue/pick-multiple
   */
  pickMultipleFromQueue = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const count = Math.min(Math.max(Number(req.body.count) || 5, 1), 10);
      const queueItems = await complaintQueueService.pickMultipleFromQueue(userId, count);

      if (queueItems.length === 0) {
        res.status(200).json({
          success: true,
          message: "Không có khiếu nại nào trong hàng đợi",
          data: [],
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Đã nhận ${queueItems.length} khiếu nại`,
        data: queueItems,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Assign complaint to moderator
   * POST /api/complaints/:id/assign
   */
  assignToModerator = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const { moderatorId } = req.body;

      // If no moderatorId provided, assign to self
      const assigneeId = moderatorId || userId;

      const ticket = await complaintService.assignToModerator(id, assigneeId);

      res.status(200).json({
        success: true,
        message: "Đã giao khiếu nại cho moderator",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add internal note
   * POST /api/complaints/:id/internal-note
   */
  addInternalNote = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const { content } = addInternalNoteSchema.parse(req.body);

      const ticket = await complaintService.addInternalNote(id, userId, content);

      res.status(200).json({
        success: true,
        message: "Đã thêm ghi chú nội bộ",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request more information
   * POST /api/complaints/:id/request-info
   */
  requestMoreInfo = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const { targetParty, questions } = requestInfoSchema.parse(req.body);

      const ticket = await complaintService.requestMoreInfo(
        id,
        userId,
        targetParty,
        questions
      );

      res.status(200).json({
        success: true,
        message: "Đã yêu cầu thêm thông tin",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Make decision on complaint
   * POST /api/complaints/:id/decision
   */
  makeDecision = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const input = makeDecisionSchema.parse(req.body);

      const ticket = await complaintService.makeDecision(id, userId, input);

      res.status(200).json({
        success: true,
        message: "Đã đưa ra quyết định",
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get moderator workload
   * GET /api/complaints/moderator/workload
   */
  getModeratorWorkload = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workload = await complaintQueueService.getModeratorWorkload();

      res.status(200).json({
        success: true,
        data: workload,
      });
    } catch (error) {
      next(error);
    }
  };

  // ===== Admin Endpoints =====

  /**
   * Resolve appeal (Admin/Senior Mod)
   * POST /api/complaints/:id/appeal-decision
   */
  resolveAppeal = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const id = getParamString(req.params.id);
      const input = appealDecisionSchema.parse(req.body);

      const ticket = await complaintService.resolveAppeal(id, userId, input);

      res.status(200).json({
        success: true,
        message: `Kháng cáo đã được ${input.decision === "Upheld" ? "giữ nguyên" : "đảo ngược"}`,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  // ===== Common Endpoints =====

  /**
   * Get complaint by ID
   * GET /api/complaints/:id
   */
  getComplaintById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      const id = getParamString(req.params.id);

      const ticket = await complaintService.getComplaintById(
        id,
        user ? { id: user.id, roleKey: user.roleKey } : undefined
      );

      if (!ticket) {
        throw new AppError("Khiếu nại không tồn tại", 404);
      }

      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get complaint timeline
   * GET /api/complaints/:id/timeline
   */
  getComplaintTimeline = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const user = req.user;
      const id = getParamString(req.params.id);

      const ticket = await complaintService.getComplaintById(
        id,
        user ? { id: user.id, roleKey: user.roleKey } : undefined
      );

      if (!ticket) {
        throw new AppError("Khiếu nại không tồn tại", 404);
      }

      const timeline = await ComplaintTimeline.find({ ticketId: id })
        .populate("actorUserId", "fullName email")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all complaints (admin/moderator)
   * GET /api/complaints
   */
  getAllComplaints = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = getComplaintsQuerySchema.parse(req.query);
      const { tickets, total } = await complaintService.getAllComplaints(query);

      res.status(200).json({
        success: true,
        data: tickets,
        pagination: { total, limit: query.limit, skip: query.skip },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if can file complaint for an order item
   * GET /api/complaints/check/:orderItemId
   */
  checkCanFileComplaint = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const orderItemId = getParamString(req.params.orderItemId);
      const result = await complaintService.canFileComplaint(orderItemId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const complaintController = new ComplaintController();
