"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportService } from "@/lib/services/report.service";
import { OrderTrendResponse, OrderStatusResponse } from "@/types/report";
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
  ShoppingCart, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCcw, 
  ChevronRight,
  TrendingUp,
  PieChart,
  History
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminOrdersPage() {
  const [trend, setTrend] = useState<OrderTrendResponse | null>(null);
  const [statusData, setStatusData] = useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [trendRes, statusRes] = await Promise.all([
          reportService.getOrderTrends({ granularity }),
          reportService.getOrdersByStatus({}),
        ]);
        if (trendRes.success) setTrend(trendRes.data || null);
        if (statusRes.success) setStatusData(statusRes.data || null);
      } catch (error) {
        console.error("Failed to fetch order data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [granularity]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid": return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Completed": return <Package className="h-4 w-4 text-blue-500" />;
      case "Cancelled": return <XCircle className="h-4 w-4 text-slate-400" />;
      case "Disputed": return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "Refunded": return <RefreshCcw className="h-4 w-4 text-amber-500" />;
      default: return <ShoppingCart className="h-4 w-4 text-slate-400" />;
    }
  };

  if (loading && !trend) return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <div className="grid gap-6 md:grid-cols-7">
        <Skeleton className="col-span-4 h-96" />
        <Skeleton className="col-span-3 h-96" />
      </div>
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
            <span className="text-foreground font-medium">Đơn hàng</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Báo cáo đơn hàng</h2>
        </div>
        <ReportNav isAdmin={true} />
      </div>

      {/* KPI Cards Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusData?.byStatus.slice(0, 4).map((s, idx) => (
          <Card key={s.status} className={`border-none shadow-md overflow-hidden relative group transition-all hover:shadow-lg ${
            idx === 0 ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" :
            idx === 1 ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white" :
            "bg-white"
          }`}>
            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
              {getStatusIcon(s.status)}
            </div>
            <CardHeader className="pb-2">
              <CardTitle className={`text-xs font-medium uppercase tracking-wider ${
                idx < 2 ? "text-white/80" : "text-slate-500"
              }`}>{s.status}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${idx < 2 ? "text-white" : "text-slate-900"}`}>{s.count}</div>
              <p className={`text-[10px] mt-1 italic ${idx < 2 ? "text-white/70" : "text-slate-400"}`}>
                {formatCurrency(s.totalAmount)} ({s.percentage}%)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Section */}
      <div className="grid gap-6 md:grid-cols-7 pt-4">
        {/* Trend Chart */}
        <div className="col-span-4 space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-slate-800">Xu hướng đơn hàng</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest text-nowrap">Độ chia:</span>
              <Select value={granularity} onValueChange={(v: "day" | "week" | "month") => setGranularity(v)}>
                <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
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
          
          <div className="bg-white p-4 rounded-xl border shadow-sm">
            {trend && (
              <ReportChart
                title=""
                data={trend.data}
                lines={[
                  { key: "orderCount", name: "Số đơn hàng", color: "#2563eb" },
                ]}
              />
            )}
          </div>
        </div>

        {/* Status Distribution Table */}
        <Card className="col-span-3 border-none shadow-md bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-indigo-500" />
              Phân bổ trạng thái
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
                {statusData?.byStatus.map((s) => (
                  <TableRow key={s.status} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium flex items-center gap-3 py-4">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100">
                        {getStatusIcon(s.status)}
                      </div>
                      <span className="text-slate-700">{s.status}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-900">{s.count}</TableCell>
                    <TableCell className="text-right">
                       <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-slate-600">{s.percentage}%</span>
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-indigo-500 rounded-full transition-all" 
                               style={{ width: `${s.percentage}%` }}
                             />
                          </div>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="p-4 bg-slate-50/30 border-t flex items-center justify-between text-xs text-slate-400 italic">
               <div className="flex items-center gap-1.5">
                  <History className="h-3 w-3" />
                  Tổng cộng: {statusData?.total} đơn hàng
               </div>
               <span>Cập nhật theo thời gian thực</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
