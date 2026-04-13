"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reportService } from "@/lib/services/report.service";
import { SellerDashboardResponse } from "@/types/report";
import { ReportNav } from "@/components/ui/report-nav";
import { 
  DollarSign, 
  Package, 
  TrendingUp, 
  Clock, 
  Star,
  Receipt,
  CheckCircle2,
  ShoppingBag,
  Percent
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function SellerDashboardPage() {
  const [data, setData] = useState<SellerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await reportService.getSellerDashboard();
        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch seller dashboard:", error);
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
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 bg-white">
      <ShoppingBag className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Không thể tải dữ liệu shop</h2>
      <p className="text-muted-foreground">Vui lòng kiểm tra lại trạng thái shop của bạn.</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Báo cáo Shop: {data.shopName}</h2>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            Cập nhật: {new Date(data.snapshot.timestamp).toLocaleString('vi-VN')}
          </div>
        </div>
        <ReportNav isAdmin={false} />
      </div>

      {/* Primary KPI Cards - Seller Tone (Purple/Teal) */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 pt-2">
        <Card className="border-none shadow-md bg-gradient-to-br from-purple-600 to-purple-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <DollarSign className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Doanh thu hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.todayRevenue)}</div>
            <div className="mt-2 flex items-center text-xs text-purple-100 italic">
              <TrendingUp className="mr-1 h-3 w-3" /> Doanh số trong ngày
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-teal-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp className="h-16 w-16" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-teal-100 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Doanh thu tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.monthRevenue)}</div>
            <div className="mt-2 text-xs text-teal-100 italic">Trong 30 ngày qua</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-l-4 border-l-purple-500">
          <div className="absolute top-0 right-0 p-4 text-purple-50 group-hover:text-purple-100 transition-colors">
            <Package className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-400" />
              Đơn hàng mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.orders.todayOrders}</div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3 w-3 text-orange-500" />
              {data.orders.pendingDelivery} đơn chờ giao
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all border-l-4 border-l-teal-500">
          <div className="absolute top-0 right-0 p-4 text-teal-50 group-hover:text-teal-100 transition-colors">
            <Star className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              Đánh giá Shop
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{data.rating.average}/5</div>
            <div className="mt-2 text-xs text-slate-500">
              Từ <span className="font-bold text-teal-600">{data.rating.totalReviews}</span> nhận xét
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Sections */}
      <div className="grid gap-6 md:grid-cols-2 pt-4">
        {/* Wallet Section */}
        <Card className="border shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-500" />
              Tài chính & Ví Shop
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-purple-50 p-6 rounded-2xl flex items-center justify-between border border-purple-100">
              <div className="space-y-1">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">Số dư đang giữ (Escrow)</p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.revenue.pendingPayout)}</p>
              </div>
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-purple-100">
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
            </div>

            <div className="bg-teal-50 p-6 rounded-2xl flex items-center justify-between border border-teal-100">
              <div className="space-y-1">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Thực nhận (Net Revenue)</p>
                <p className="text-3xl font-bold text-slate-900">{formatCurrency(data.revenue.totalReceived)}</p>
              </div>
              <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-teal-100">
                <CheckCircle2 className="h-6 w-6 text-teal-500" />
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 italic flex items-center gap-1.5">
              <Percent className="h-3.5 w-3.5" />
              Số tiền thực nhận đã được trừ 5% phí sàn cố định.
            </div>
          </CardContent>
        </Card>

        {/* Orders Status Section */}
        <Card className="border shadow-sm bg-white overflow-hidden">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
              <ShoppingBag className="h-5 w-5 text-teal-500" />
              Tình trạng vận hành
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-8">
             <div className="flex items-center gap-6">
                <div className="h-20 w-20 bg-teal-50 rounded-3xl flex items-center justify-center border border-teal-100 relative">
                  <Package className="h-10 w-10 text-teal-600" />
                  <Badge className="absolute -top-2 -right-2 bg-teal-600 font-bold">{data.orders.completed}</Badge>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">{data.orders.completed}</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Đơn hàng hoàn thành</div>
                </div>
             </div>

             <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 relative overflow-hidden group hover:bg-orange-100/50 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:scale-110 transition-transform">
                  <Clock className="h-16 w-16 text-orange-900" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-orange-700 uppercase tracking-wider">Đang chờ giao hàng</span>
                  <Badge variant="outline" className="border-orange-500 text-orange-700 bg-white font-bold">{data.orders.pendingDelivery}</Badge>
                </div>
                <div className="text-sm text-orange-600 font-medium">
                  {data.orders.pendingDelivery > 0 
                    ? `Bạn có ${data.orders.pendingDelivery} đơn hàng cần xử lý ngay`
                    : "Tuyệt vời! Không có đơn hàng nào tồn đọng"}
                </div>
             </div>

             <div className="flex gap-4 pt-2">
                <Button asChild variant="outline" className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50">
                  <Link href="/seller/orders">Xem danh sách đơn</Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-teal-200 text-teal-700 hover:bg-teal-50">
                  <Link href="/seller/reports/orders">Phân tích chi tiết</Link>
                </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
