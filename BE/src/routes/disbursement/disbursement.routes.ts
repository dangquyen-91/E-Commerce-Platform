import { Router } from "express";
import { disbursementController } from "@/controllers/disbursement/disbursement.controller";
import { authenticate, authorize } from "@/middleware/auth";

const router = Router();

// Cron endpoint - protected by secret key (no auth needed)
router.get(
  "/cron/process",
  disbursementController.processPendingDisbursements
);

// Admin endpoints - require authentication and admin/moderator role

// Get ALL holding items (regardless of time)
router.get(
  "/holding",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  disbursementController.getAllHoldingItems
);

// Get items ready for disbursement (past 72h only)
router.get(
  "/pending",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  disbursementController.getPendingDisbursements
);

router.post(
  "/:itemId",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  disbursementController.triggerDisbursement
);

router.get(
  "/stats",
  authenticate,
  authorize("ADMIN", "MODERATOR"),
  disbursementController.getDisbursementStats
);

export default router;
