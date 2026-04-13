"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  DollarSign,
  AlertTriangle,
  Settings,
  Shield,
  FileText,
  UserCheck,
  Wallet,
  Package,
  ArrowRight,
} from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import { shopService, Shop } from "@/lib/services/shop.service";
import { AdminDashboardResponse } from "@/types/report";
import { AdminRevenueChart, AdminOrderChart, AdminDateRangeChart, AdminShopRankingChart, AdminTopProductsChart } from "@/components/admin/dashboard";

const formatPrice = (price: number) => {
  if (price >= 1_000_000_000) {
    return `${(price / 1_000_000_000).toFixed(1)}B`;
  }
  if (price >= 1_000_000) {
    return `${(price / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [dashboardRes, shopsRes] = await Promise.all([
          reportService.getDashboard(),
          shopService.getPendingShops(),
        ]);

        if (dashboardRes.success && dashboardRes.data) {
          setDashboard(dashboardRes.data);
        }
        setPendingShops(shopsRes);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const revenue = dashboard?.revenue;
  const escrow = dashboard?.escrow;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Quản trị</h1>
          <p className="text-sm text-muted-foreground">
            Tổng quan hệ thống
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings">
            <Settings className="h-4 w-4 mr-2" />
            Cấu hình
          </Link>
        </Button>
      </div>

      {/* Revenue Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Doanh thu Platform
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Hôm nay</p>
              <p className="text-xl font-bold text-green-600">
                {formatPrice(revenue?.todayRevenue ?? 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Tuần này</p>
              <p className="text-xl font-bold text-blue-600">
                {formatPrice(revenue?.weekRevenue ?? 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Tháng này</p>
              <p className="text-xl font-bold text-purple-600">
                {formatPrice(revenue?.monthRevenue ?? 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Phí platform</p>
              <p className="text-xl font-bold text-orange-600">
                {formatPrice(revenue?.platformFeeToday ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Escrow */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Escrow & Giải ngân
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/disbursement">
                Chi tiết <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Tổng đang giữ</p>
              <p className="text-lg font-bold text-blue-600">
                {formatPrice(escrow?.totalHolding ?? 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Sẵn sàng giải ngân</p>
              <p className="text-lg font-bold text-green-600">
                {formatPrice(escrow?.readyForDisbursement ?? 0)}
              </p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Có khiếu nại</p>
              <p className="text-lg font-bold text-red-600">
                {formatPrice(escrow?.withComplaints ?? 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts - Row 1: Top sản phẩm + Xếp hạng Shop */}
      <div className="grid gap-6 md:grid-cols-2">
        <AdminTopProductsChart />
        <AdminShopRankingChart />
      </div>

      {/* Analytics Charts - Row 2: Thống kê doanh thu + Đơn hàng */}
      <div className="grid gap-6 md:grid-cols-2">
        <AdminRevenueChart />
        <AdminOrderChart />
      </div>

      {/* Analytics Charts - Row 3: Thời gian tùy chọn */}
      <AdminDateRangeChart />

      {/* Pending Sellers */}
      {pendingShops.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Seller chờ duyệt
                </CardTitle>
                <CardDescription>{pendingShops.length} đơn cần xử lý</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/sellers">Xem tất cả</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingShops.slice(0, 3).map((shop) => (
                <div
                  key={shop._id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{shop.shopName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(shop.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <Badge variant="secondary">Chờ duyệt</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Thao tác nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4" />
                <span className="text-xs">Người dùng</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href="/admin/sellers">
                <UserCheck className="h-4 w-4" />
                <span className="text-xs">Duyệt Seller</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href="/admin/disbursement">
                <Wallet className="h-4 w-4" />
                <span className="text-xs">Giải ngân</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href="/admin/categories">
                <Package className="h-4 w-4" />
                <span className="text-xs">Danh mục</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href="/admin/permissions">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Phân quyền</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" asChild>
              <Link href="/admin/reports">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Báo cáo</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
