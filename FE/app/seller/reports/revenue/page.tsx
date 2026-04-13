"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportService } from "@/lib/services/report.service";
import { SellerRevenueTrendResponse } from "@/types/report";
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
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  Wallet, 
  ChevronRight,
  ArrowUpRight,
  History,
  Percent
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerRevenuePage() {
  const [trend, setTrend] = useState<SellerRevenueTrendResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await reportService.getSellerRevenueTrends({ granularity });
        if (res.success) setTrend(res.data || null);
      } catch (error) {
        console.error("Failed to fetch seller revenue trends:", error);
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
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );

  const totalSales = trend?.data.reduce((sum, item) => sum + item.sales, 0) || 0;
  const totalNet = trend?.data.reduce((sum, item) => sum + item.netRevenue, 0) || 0;
  const totalFees = trend?.data.reduce((sum, item) => sum + item.platformFee, 0) || 0;

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/seller/reports" className="hover:text-purple-600 transition-colors">Báo cáo Shop</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Doanh thu</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Phân tích doanh thu</h2>
        </div>
        <ReportNav isAdmin={false} />
      </div>

      {/* KPI Cards - Seller Tone (Purple/Teal) */}
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3 pt-2">
        <Card className="border-none shadow-md bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-purple-100 uppercase tracking-wider flex items-center gap-2">
              Tổng doanh số (Gross)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
            <div className="mt-2 flex items-center text-[10px] text-purple-100 italic">
              <History className="mr-1 h-3 w-3" /> Toàn bộ giá trị đơn hàng
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-teal-700 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-teal-100 uppercase tracking-wider flex items-center gap-2">
              Thực nhận (Net Revenue)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNet)}</div>
            <div className="mt-2 flex items-center text-[10px] text-teal-100">
              <ArrowUpRight className="mr-1 h-3 w-3" /> Sau khi trừ phí sàn
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-l-4 border-l-red-500">
          <div className="absolute top-0 right-0 p-4 text-red-50 group-hover:text-red-100 transition-colors">
            <CreditCard className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Phí sàn chi trả
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalFees)}</div>
            <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1 italic">
              <Percent className="h-3 w-3" /> Cố định 5% doanh số
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-slate-800">Biểu đồ xu hướng</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Độ chia:</span>
            <Select value={granularity} onValueChange={(v: "day" | "week" | "month") => setGranularity(v)}>
              <SelectTrigger className="w-[120px] h-8 text-xs font-medium border-purple-100">
                <SelectValue placeholder="Chọn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Theo ngày</SelectItem>
                <SelectItem value="week">Theo tuần</SelectItem>
                <SelectItem value="month">Theo tháng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm group hover:shadow-md transition-shadow">
          {trend && (
            <ReportChart
              title=""
              data={trend.data}
              lines={[
                { key: "sales", name: "Doanh số (Gross)", color: "#9333ea" },
                { key: "netRevenue", name: "Thực nhận (Net)", color: "#0d9488" },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}
