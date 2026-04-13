import { Router } from "express";
import { reportController } from "@/controllers/reports/report.controller";
import { authenticate } from "@/middleware/auth";
import { checkPermission } from "@/middleware/permission";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();

// All routes require authentication and ANALYTICS_VIEW permission
const adminAuth = [authenticate, checkPermission(PERMISSIONS.ANALYTICS_VIEW)];

// Dashboard
router.get("/dashboard", ...adminAuth, reportController.getDashboard);

// Revenue Reports
router.get("/revenue/overview", ...adminAuth, reportController.getRevenueOverview);
router.get("/revenue/platform-fees", ...adminAuth, reportController.getPlatformFees);
router.get("/revenue/trends", ...adminAuth, reportController.getRevenueTrends);

// Order Reports
router.get("/orders/overview", ...adminAuth, reportController.getOrderOverview);
router.get("/orders/by-status", ...adminAuth, reportController.getOrdersByStatus);
router.get("/orders/trends", ...adminAuth, reportController.getOrderTrends);
router.get("/orders/payment-methods", ...adminAuth, reportController.getPaymentMethods);

// Complaint Reports (may require additional COMPLAINT_STATS_VIEW permission for moderators)
const complaintAuth = [
  authenticate,
  checkPermission(PERMISSIONS.ANALYTICS_VIEW, PERMISSIONS.COMPLAINT_STATS_VIEW),
];
router.get("/complaints/overview", ...complaintAuth, reportController.getComplaintOverview);
router.get("/complaints/trends", ...complaintAuth, reportController.getComplaintTrends);
router.get("/complaints/resolution", ...complaintAuth, reportController.getResolutionStats);
router.get("/complaints/sla", ...complaintAuth, reportController.getSLACompliance);

// Shop Rankings
router.get("/shops/rankings", ...adminAuth, reportController.getShopRankings);

// Top Selling Products
router.get("/products/top-selling", ...adminAuth, reportController.getTopSellingProducts);

export default router;
