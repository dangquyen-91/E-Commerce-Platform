import { disbursementService } from "@/services/disbursement/disbursement.service";
import { complaintService } from "@/services/complaints/complaint.service";

// Run every 15 minutes
const DISBURSEMENT_INTERVAL_MS = 15 * 60 * 1000;

let disbursementIntervalId: NodeJS.Timeout | null = null;
let isProcessing = false;

export class SchedulerService {
  /**
   * Start the disbursement scheduler
   * Runs every 15 minutes to process pending disbursements
   */
  startDisbursementScheduler(): void {
    if (disbursementIntervalId) {
      return;
    }

    // Run immediately on start
    this.runDisbursementJob();

    // Then run every 15 minutes
    disbursementIntervalId = setInterval(() => {
      this.runDisbursementJob();
    }, DISBURSEMENT_INTERVAL_MS);
  }

  /**
   * Stop the disbursement scheduler
   */
  stopDisbursementScheduler(): void {
    if (disbursementIntervalId) {
      clearInterval(disbursementIntervalId);
      disbursementIntervalId = null;
    }
  }

  /**
   * Run disbursement job
   */
  private async runDisbursementJob(): Promise<void> {
    if (isProcessing) {
      return;
    }

    isProcessing = true;

    try {
      await disbursementService.processAllPendingDisbursements();
      await complaintService.autoEscalatePendingSellerComplaints();
    } catch {
      // Scheduler job failed - will retry on next schedule
    } finally {
      isProcessing = false;
    }
  }

  /**
   * Manually trigger disbursement (for testing/admin)
   */
  async triggerDisbursement(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
    errors: string[];
  }> {
    return disbursementService.processAllPendingDisbursements();
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    disbursementSchedulerRunning: boolean;
    isProcessing: boolean;
  } {
    return {
      disbursementSchedulerRunning: disbursementIntervalId !== null,
      isProcessing,
    };
  }
}

export const schedulerService = new SchedulerService();
