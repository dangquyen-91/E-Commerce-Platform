import { Router } from "express";
import { complaintController } from "@/controllers/complaints/complaint.controller";
import { schedulerService } from "@/services/scheduler/scheduler.service";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";
import { AuthRequest } from "@/middleware/auth";

const router = Router();

// All routes require authentication
router.use(authenticate);

// ===== Admin Routes (must be before parameterized routes) =====

// Admin: Manually trigger disbursement processing
router.post(
  "/admin/trigger-disbursement",
  checkPermission(PERMISSIONS.ORDER_MANAGE),
  wrapRequestHandler(async (_req: AuthRequest, res) => {
    const result = await schedulerService.triggerDisbursement();
    res.status(200).json({
      success: true,
      message: "Disbursement triggered",
      data: result,
    });
  })
);

// Admin: Get scheduler status
router.get(
  "/admin/scheduler-status",
  checkPermission(PERMISSIONS.SYSTEM_MONITOR),
  wrapRequestHandler(async (_req: AuthRequest, res) => {
    const status = schedulerService.getStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  })
);

// ===== Moderator Queue Routes =====

// Get complaint queue (moderator)
router.get(
  "/queue",
  checkPermission(PERMISSIONS.COMPLAINT_QUEUE_VIEW),
  wrapRequestHandler(complaintController.getQueue)
);

// Get queue statistics (moderator)
router.get(
  "/queue/stats",
  checkPermission(PERMISSIONS.COMPLAINT_QUEUE_VIEW),
  wrapRequestHandler(complaintController.getQueueStats)
);

// NOTE: Queue picking removed - complaints are auto-assigned to single moderator

// ===== Moderator Workload Routes =====

// Get moderator workload (admin/moderator)
router.get(
  "/moderator/workload",
  checkPermission(PERMISSIONS.COMPLAINT_STATS_VIEW),
  wrapRequestHandler(complaintController.getModeratorWorkload)
);

// ===== Customer/Seller Routes =====

// Get my complaints as buyer
router.get(
  "/me",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(complaintController.getMyComplaints)
);

// Get my complaints as seller (shop owner)
router.get(
  "/seller/me",
  checkPermission(PERMISSIONS.COMPLAINT_VIEW_SHOP),
  wrapRequestHandler(complaintController.getSellerComplaints)
);

// Check if can file complaint for an order item
router.get(
  "/check/:orderItemId",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(complaintController.checkCanFileComplaint)
);

// ===== Root Routes =====

// Create complaint (customer)
router.post(
  "/",
  checkPermission(PERMISSIONS.TICKET_CREATE),
  wrapRequestHandler(complaintController.createComplaint)
);

// Get all complaints (admin/moderator)
router.get(
  "/",
  checkPermission(PERMISSIONS.TICKET_VIEW_ALL),
  wrapRequestHandler(complaintController.getAllComplaints)
);

// ===== Parameterized Routes =====

// Get complaint by ID
router.get(
  "/:id",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(complaintController.getComplaintById)
);

// Get complaint timeline
router.get(
  "/:id/timeline",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(complaintController.getComplaintTimeline)
);

// ===== Buyer Actions =====

// Add evidence to complaint (buyer)
router.post(
  "/:id/evidence",
  checkPermission(PERMISSIONS.TICKET_UPDATE),
  wrapRequestHandler(complaintController.addEvidence)
);

// File an appeal (buyer)
router.post(
  "/:id/appeal",
  checkPermission(PERMISSIONS.COMPLAINT_APPEAL),
  wrapRequestHandler(complaintController.fileAppeal)
);

// ===== Seller Actions =====

// Seller decision on complaint
router.post(
  "/:id/seller-decision",
  checkPermission(PERMISSIONS.COMPLAINT_RESPOND),
  wrapRequestHandler(complaintController.sellerDecision)
);

// ===== Moderator Actions =====

// Assign complaint to moderator
router.post(
  "/:id/assign",
  checkPermission(PERMISSIONS.COMPLAINT_ASSIGN),
  wrapRequestHandler(complaintController.assignToModerator)
);

// Add internal note (moderator)
router.post(
  "/:id/internal-note",
  checkPermission(PERMISSIONS.COMPLAINT_INTERNAL_NOTE),
  wrapRequestHandler(complaintController.addInternalNote)
);

// Request more information (moderator)
router.post(
  "/:id/request-info",
  checkPermission(PERMISSIONS.COMPLAINT_REQUEST_INFO),
  wrapRequestHandler(complaintController.requestMoreInfo)
);

// Make decision on complaint (moderator)
router.post(
  "/:id/decision",
  checkPermission(PERMISSIONS.COMPLAINT_DECISION),
  wrapRequestHandler(complaintController.makeDecision)
);

// ===== Admin Actions =====

// Resolve appeal (admin/senior mod)
router.post(
  "/:id/appeal-decision",
  checkPermission(PERMISSIONS.COMPLAINT_APPEAL_REVIEW),
  wrapRequestHandler(complaintController.resolveAppeal)
);

export default router;
