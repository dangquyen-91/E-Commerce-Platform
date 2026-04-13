import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { reportService } from "@/services/reports/report.service";
import { DateRangeQuery } from "@/types/report.types";

export class ReportController {
  // Helper to convert date string to Vietnam timezone start/end of day
  private toVNStartOfDay(dateStr: string): Date {
    // Parse as Vietnam date (UTC+7) start of day
    return new Date(dateStr + "T00:00:00+07:00");
  }

  private toVNEndOfDay(dateStr: string): Date {
    // Parse as Vietnam date (UTC+7) end of day
    return new Date(dateStr + "T23:59:59.999+07:00");
  }

  // Helper to parse date range from query params
  private parseDateRange(query: any): DateRangeQuery {
    // Get current date in Vietnam timezone
    const now = new Date();
    const vnOffset = 7 * 60 * 60 * 1000;
    const vnNow = new Date(now.getTime() + vnOffset);
    const todayStr = vnNow.toISOString().split("T")[0];

    const endDateStr = query.endDate || todayStr;
    const startDateStr = query.startDate || (() => {
      const d = new Date(endDateStr);
      d.setDate(d.getDate() - 30);
      return d.toISOString().split("T")[0];
    })();

    const startDate = this.toVNStartOfDay(startDateStr);
    const endDate = this.toVNEndOfDay(endDateStr);
    const granularity = (query.granularity as "day" | "week" | "month") || "day";

    return { startDate, endDate, granularity };
  }

  // ============ REVENUE REPORTS ============

  getRevenueOverview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getRevenueOverview(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getPlatformFees = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getPlatformFeeReport(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getRevenueTrends = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getRevenueTrends(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // ============ ORDER REPORTS ============

  getOrderOverview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getOrderOverview(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getOrdersByStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getOrdersByStatus(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getOrderTrends = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getOrderTrends(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getPaymentMethods = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getPaymentMethodDistribution(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // ============ COMPLAINT REPORTS ============

  getComplaintOverview = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getComplaintOverview(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getComplaintTrends = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getComplaintTrends(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getResolutionStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getResolutionStats(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getSLACompliance = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const data = await reportService.getSLACompliance(dateRange);
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // ============ DASHBOARD ============

  getDashboard = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const data = await reportService.getDashboardSummary();
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // ============ SHOP RANKINGS ============

  getShopRankings = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await reportService.getShopRankings({ ...dateRange, limit });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  // ============ TOP SELLING PRODUCTS ============

  getTopSellingProducts = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const dateRange = this.parseDateRange(req.query);
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await reportService.getTopSellingProducts({ ...dateRange, limit });
      res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };
}

export const reportController = new ReportController();
