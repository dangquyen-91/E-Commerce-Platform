"use client";

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
  Store,
  Package,
  ShoppingCart,
  Star,
  Warehouse,
  Settings,
  AlertCircle,
  AlertTriangle,
  Plus,
  BarChart3,
} from "lucide-react";
import {
  useSellerDashboard,
  TodoSection,
  SalesSection,
  PerformanceSection,
  FinanceSection,
  RevenueChartSection,
  OrderStatusSection,
} from "./dashboard";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-500">Hoạt động</Badge>;
    case "Pending":
      return <Badge variant="secondary">Chờ duyệt</Badge>;
    case "Suspended":
      return <Badge variant="destructive">Tạm ngưng</Badge>;
    case "Closed":
      return <Badge variant="outline">Đã đóng</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-24 w-full" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

function NoShopState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Chưa có cửa hàng</h2>
        <p className="text-muted-foreground mb-6">
          Bạn cần đăng ký trở thành người bán để bắt đầu kinh doanh
        </p>
        <Button asChild>
          <Link href="/seller/register">Đăng ký bán hàng</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PendingShopState() {
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="py-8 text-center">
        <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-lg font-semibold mb-2">Đang chờ duyệt</h2>
        <p className="text-muted-foreground">
          Đơn đăng ký bán hàng của bạn đang được xem xét. Vui lòng chờ trong 1-3
          ngày làm việc.
        </p>
      </CardContent>
    </Card>
  );
}

export function SellerHome() {
  const { shop, stats, dashboard, loading, error, todoItems, hasTodos } =
    useSellerDashboard();

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
            <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-6">
        <NoShopState />
      </div>
    );
  }

  if (shop.status === "Pending") {
    return (
      <div className="container mx-auto px-4 py-6">
        <PendingShopState />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Store className="h-7 w-7 text-primary" />
          </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{shop.shopName}</h1>
                {getStatusBadge(shop.status)}
              </div>
              <p className="text-sm text-muted-foreground">
                Tổng doanh số: {stats?.totalSales?.toLocaleString() ?? 0} đơn
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" asChild>
            <Link href="/seller/settings">
              <Settings className="h-4 w-4 mr-2" />
              Cài đặt shop
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/seller/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                Báo cáo & Thống kê
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/seller/orders">Lịch sử bán hàng</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/seller/complaints">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Khiếu nại shop
              </Link>
            </Button>
            <Button asChild disabled={shop.status !== "Active"}>
              <Link href="/seller/products/create">
                <Plus className="mr-2 h-4 w-4" />
                Thêm sản phẩm
              </Link>
            </Button>
          </div>
        </div>

      {hasTodos && <TodoSection todoItems={todoItems} />}

      <div className="grid gap-6 md:grid-cols-2">
        <SalesSection dashboard={dashboard} />
        <FinanceSection stats={stats} dashboard={dashboard} />
      </div>

      <PerformanceSection shop={shop} stats={stats} />

      <div className="grid gap-6 md:grid-cols-2">
        <RevenueChartSection />
        <OrderStatusSection />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Truy cập nhanh</CardTitle>
          <CardDescription>Quản lý cửa hàng của bạn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/seller/products">
                <Package className="h-5 w-5" />
                <span className="text-xs">Sản phẩm</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/seller/orders">
                <ShoppingCart className="h-5 w-5" />
                <span className="text-xs">Đơn hàng</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/seller/inventory">
                <Warehouse className="h-5 w-5" />
                <span className="text-xs">Kho hàng</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
              <Link href="/seller/reviews">
                <Star className="h-5 w-5" />
                <span className="text-xs">Đánh giá</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
