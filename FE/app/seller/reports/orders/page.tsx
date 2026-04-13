"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportService } from "@/lib/services/report.service";
import { OrderTrendResponse, SellerOrderOverviewResponse } from "@/types/report";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
  ShoppingBag,
  ChevronRight,
  TrendingUp,
  PieChart,
  Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function SellerOrdersPage() {
  const [trend, setTrend] = useState<OrderTrendResponse | null>(null);
  const [overview, setOverview] = useState<SellerOrderOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendRes, overviewRes] = await Promise.all([
          reportService.getSellerOrderTrends({ granularity }),
          reportService.getSellerOrderOverview({}),
        ]);
        if (trendRes.success) setTrend(trendRes.data || null);
        if (overviewRes.success) setOverview(overviewRes.data || null);
      } catch (error) {
        console.error("Failed to fetch seller order data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [granularity]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const getStatusMeta = (status: string) => {
    switch (status) {
      case "WaitingDelivery":
        return { icon: <Truck className="h-4 w-4 text-orange-500" />, label: "Chờ giao", color: "orange" };
      case "Delivered":
        return { icon: <Package className="h-4 w-4 text-blue-500" />, label: "Đã giao", color: "blue" };
      case "Completed":
        return { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, label: "Hoàn thành", color: "emerald" };
      case "Disputed":
        return { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, label: "Tranh chấp", color: "red" };
      case "Refunded":
        return { icon: <RefreshCcw className="h-4 w-4 text-slate-500" />, label: "Hoàn tiền", color: "slate" };
      default:
        return { icon: <ShoppingBag className="h-4 w-4 text-muted-foreground" />, label: status, color: "slate" };
    }
  };

  if (loading && !trend) {
    return (
      <div className="flex-1 space-y-6 p-8 pt-6 bg-white">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-7">
          <Skeleton className="col-span-4 h-96" />
          <Skeleton className="col-span-3 h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/seller/reports" className="hover:text-purple-600 transition-colors">
              Báo cáo Shop
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Đơn hàng</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Phân tích đơn hàng</h2>
        </div>
        <ReportNav isAdmin={false} />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
        <Card className="border-none shadow-md bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShoppingBag className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-purple-100 uppercase tracking-wider">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.totalOrders || 0}</div>
            <div className="mt-2 flex items-center text-[10px] text-purple-100 italic">
              <Clock className="mr-1 h-3 w-3" /> Trong kỳ thống kê
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-teal-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Package className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-teal-100 uppercase tracking-wider">Giá trị trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview?.averageOrderValue || 0)}</div>
            <div className="mt-2 text-[10px] text-teal-100 italic">Trung bình mỗi đơn</div>
          </CardContent>
        </Card>

        {(overview?.byStatus || []).slice(0, 2).map((s) => {
          const meta = getStatusMeta(s.status);
          return (
            <Card
              key={s.status}
              className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-l-4 border-l-purple-200"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  {meta.icon}
                  {meta.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{s.count}</div>
                <p className="text-[10px] mt-1 italic text-slate-400">{s.percentage}% tổng đơn</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main content */}
      <div className="grid gap-6 md:grid-cols-7 pt-4">
        {/* Trend Chart */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-slate-800">Xu hướng đơn hàng</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-nowrap">Độ chia:</span>
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
                lines={[{ key: "orderCount", name: "Số đơn hàng", color: "#0d9488" }]}
              />
            )}
          </div>
        </div>

        {/* Status Table */}
        <Card className="col-span-3 border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-teal-500" />
              Trạng thái đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase">Trạng thái</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Số lượng</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Tỷ lệ %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview?.byStatus.map((s) => {
                  const meta = getStatusMeta(s.status);
                  return (
                    <TableRow key={s.status} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium flex items-center gap-3 py-4">
                        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                          {meta.icon}
                        </div>
                        <span className="text-slate-700">{meta.label}</span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-slate-900">{s.count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-slate-600">{s.percentage}%</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-500 rounded-full transition-all"
                              style={{ width: `${s.percentage}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
