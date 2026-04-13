"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportService } from "@/lib/services/report.service";
import { AdminDashboardResponse } from "@/types/report";
import { ReportNav } from "@/components/ui/report-nav";
import { 
  DollarSign, 
  Package, 
  AlertCircle, 
  ShieldAlert,
  Clock,
  TrendingUp,
  Receipt,
  ArrowUpRight,
  Activity
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await reportService.getDashboard();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch admin dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <Skeleton className="col-span-4 h-64" />
        <Skeleton className="col-span-3 h-64" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 bg-white">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Không thể tải dữ liệu báo cáo</h2>
      <p className="text-muted-foreground">Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Tổng quan hệ thống</h2>
          <p className="text-slate-500 text-sm">Cập nhật lúc: {new Date(data.snapshot.timestamp).toLocaleString('vi-VN')}</p>
        </div>
        <ReportNav isAdmin={true} />
      </div>

      {/* Primary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
        <Card className="border shadow-sm bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Doanh thu hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.todayRevenue)}</div>
            <div className="mt-2 flex items-center text-xs text-blue-100">
              <ArrowUpRight className="mr-1 h-3 w-3" />
              Phí sàn: {formatCurrency(data.revenue.platformFeeToday)}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Doanh thu tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.monthRevenue)}</div>
            <div className="mt-2 text-xs text-indigo-100 italic">Trong 30 ngày qua</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 text-slate-50 group-hover:text-slate-100 transition-colors">
            <Package className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Package className="h-4 w-4 text-slate-400" />
              Đơn hàng hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.orders.todayOrders}</div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <Activity className="h-3 w-3 text-amber-500" />
              {data.orders.pendingOrders} đơn chờ thanh toán
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 p-4 text-red-50 group-hover:text-red-100 transition-colors">
            <AlertCircle className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              Khiếu nại mở
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.complaints.openTickets}</div>
            <div className="mt-2 text-xs text-slate-500">
              <span className="text-red-500 font-medium">{data.complaints.urgentTickets} khẩn cấp</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Data Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 border shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-500" />
              Trạng thái Escrow (Ký gửi)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-between border">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-500">Tổng tiền đang giữ</p>
                  <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.escrow.totalHolding)}</p>
                </div>
                <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-sm border">
                  <DollarSign className="h-7 w-7 text-indigo-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm hover:border-green-100 hover:bg-green-50/20 transition-all">
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                    <Receipt className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Sẵn sàng thanh toán</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{data.escrow.readyForDisbursement} <span className="text-sm font-normal text-slate-500">đơn</span></p>
                </div>

                <div className="border border-slate-100 p-5 rounded-2xl bg-white shadow-sm hover:border-red-100 hover:bg-red-50/20 transition-all">
                  <div className="flex items-center gap-2 mb-2 text-slate-600">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Đang bị khiếu nại</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{data.escrow.withComplaints} <span className="text-sm font-normal text-slate-500">đơn</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 border shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-amber-500" />
              Hiệu suất vận hành
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
             <div className="flex items-center gap-5">
                <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">{data.complaints.avgResolutionHours}h</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Thời gian xử lý TB</div>
                </div>
             </div>
             
             <div className="p-6 bg-red-50 rounded-2xl border border-red-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <AlertCircle className="h-12 w-12 text-red-900" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-red-700 uppercase tracking-wider">Vi phạm SLA hôm nay</span>
                  <Badge variant="destructive">{data.complaints.slaBreachedToday}</Badge>
                </div>
                <div className="text-sm text-red-600 font-medium">
                  {data.complaints.slaBreachedToday > 0 
                    ? `Phát hiện ${data.complaints.slaBreachedToday} ticket quá hạn xử lý`
                    : "Tất cả ticket đều trong tầm kiểm soát"}
                </div>
             </div>

             <div className="pt-2 text-xs text-slate-400 italic flex items-center gap-1.5">
               <ShieldAlert className="h-3.5 w-3.5" />
               Dữ liệu SLA: Phản hồi trong 4h, xử lý trong 48h.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
