import { Router } from "express";
import { sellerReportController } from "@/controllers/reports/seller-report.controller";
import { authenticate } from "@/middleware/auth";
import { checkPermission } from "@/middleware/permission";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();

// All routes require authentication and SALES_REPORT_VIEW permission
const sellerAuth = [authenticate, checkPermission(PERMISSIONS.SALES_REPORT_VIEW)];

// Dashboard
router.get("/dashboard", ...sellerAuth, sellerReportController.getDashboard);

// Revenue Reports
router.get("/revenue/overview", ...sellerAuth, sellerReportController.getRevenueOverview);
router.get("/revenue/trends", ...sellerAuth, sellerReportController.getRevenueTrends);

// Order Reports
router.get("/orders/overview", ...sellerAuth, sellerReportController.getOrderOverview);
router.get("/orders/by-status", ...sellerAuth, sellerReportController.getOrdersByStatus);
router.get("/orders/trends", ...sellerAuth, sellerReportController.getOrderTrends);

export default router;
