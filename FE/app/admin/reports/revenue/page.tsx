"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportService } from "@/lib/services/report.service";
import { RevenueTrendResponse, RevenueOverview } from "@/types/report";
import { ReportChart } from "@/components/ui/report-chart";
import { ReportNav } from "@/components/ui/report-nav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  CreditCard, 
  DollarSign, 
  Undo2, 
  Wallet, 
  ChevronRight,
  ArrowUpRight,
  TrendingUp,
  History
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminRevenuePage() {
  const [trend, setTrend] = useState<RevenueTrendResponse | null>(null);
  const [overview, setOverview] = useState<RevenueOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendRes, overviewRes] = await Promise.all([
          reportService.getRevenueTrends({ granularity }),
          reportService.getRevenueOverview({}),
        ]);
        if (trendRes.success) setTrend(trendRes.data || null);
        if (overviewRes.success) setOverview(overviewRes.data || null);
      } catch (error) {
        console.error("Failed to fetch revenue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [granularity]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  if (loading && !trend) return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin/reports" className="hover:text-primary transition-colors">Báo cáo</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Doanh thu</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Báo cáo doanh thu</h2>
        </div>
        <ReportNav isAdmin={true} />
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <DollarSign className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-blue-100 uppercase tracking-wider">Tổng doanh thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
              <div className="mt-1 flex items-center text-[10px] text-blue-100 italic">
                <History className="mr-1 h-3 w-3" /> Toàn thời gian
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-emerald-600 to-emerald-700 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <CreditCard className="h-12 w-12" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Phí sàn thu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(overview.platformFeeCollected)}</div>
              <div className="mt-1 flex items-center text-[10px] text-emerald-100">
                <ArrowUpRight className="mr-1 h-3 w-3" /> Thực nhận hệ thống
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 text-slate-50 group-hover:text-slate-100 transition-colors">
              <Wallet className="h-10 w-10 text-slate-100" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã trả Seller</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-900">{formatCurrency(overview.sellerPayouts)}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 text-amber-50 group-hover:text-amber-100 transition-colors">
              <Clock className="h-10 w-10 text-amber-50" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đang giữ Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-amber-600">{formatCurrency(overview.pendingInEscrow)}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-white hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute top-0 right-0 p-3 text-red-50 group-hover:text-red-100 transition-colors">
              <Undo2 className="h-10 w-10 text-red-50" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Đã hoàn tiền</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-red-600">{formatCurrency(overview.refundedAmount)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 pt-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-800">Xu hướng doanh thu</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Độ chia:</span>
            <Select value={granularity} onValueChange={(v: "day" | "week" | "month") => setGranularity(v)}>
              <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
                <SelectValue placeholder="Chọn khoảng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Theo ngày</SelectItem>
                <SelectItem value="week">Theo tuần</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {trend && (
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            <ReportChart
              title=""
              data={trend.data}
              lines={[
                { key: "totalRevenue", name: "Doanh thu", color: "#2563eb" },
                { key: "totalFees", name: "Phí sàn", color: "#10b981" },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
