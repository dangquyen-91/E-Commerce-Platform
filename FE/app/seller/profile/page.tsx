"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuthStore } from "@/lib/auth";
import { authService, type UserResponse } from "@/lib/services/auth.service";
import { shopService, type Shop, type ShopStats } from "@/lib/services/shop.service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, Store, Settings, Wallet, Package } from "lucide-react";

function getInitials(name: string): string {
  if (!name) return "S";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getShopStatusBadge(status?: Shop["status"]) {
  switch (status) {
    case "Active":
      return <Badge className="bg-green-600">Đang hoạt động</Badge>;
    case "Pending":
      return <Badge variant="secondary">Chờ duyệt</Badge>;
    case "Suspended":
      return <Badge variant="destructive">Tạm ngưng</Badge>;
    case "Closed":
      return <Badge variant="outline">Đã đóng</Badge>;
    default:
      return <Badge variant="outline">Chưa có shop</Badge>;
  }
}

export default function SellerProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const [meRes, shopRes, statsRes] = await Promise.all([
          authService.getMe(),
          shopService.getMyShop(),
          shopService.getMyShopStats(),
        ]);

        setProfile(meRes);
        setShop(shopRes);
        setStats(statsRes);
      } catch (err: any) {
        setError(err?.message || "Không thể tải hồ sơ seller");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const displayName = profile?.fullName || user?.name || "Seller";
  const displayEmail = profile?.email || user?.email || "";
  const avatarUrl = user?.avatar;

  if (loading) {
    return (
      <RequireAuth requiredRole="seller">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-28 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth requiredRole="seller">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6 flex items-center gap-3 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback className="text-2xl">{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <div>
                    <h1 className="text-2xl font-bold">{displayName}</h1>
                    <p className="text-muted-foreground text-sm">{displayEmail}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">Seller</Badge>
                    {profile?.emailVerified && (
                      <Badge variant="outline" className="text-green-700 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Email đã xác minh
                      </Badge>
                    )}
                    {getShopStatusBadge(shop?.status)}
                  </div>
                </div>
              </div>

              <Button variant="outline" asChild>
                <Link href="/seller/shop/edit">
                  <Settings className="h-4 w-4 mr-2" />
                  Chỉnh sửa shop
                </Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Tổng đơn hàng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalOrders ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats?.totalProducts ?? 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Số dư khả dụng</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(stats?.availableBalance ?? 0).toLocaleString("vi-VN")}₫</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Thông tin shop</CardTitle>
            <CardDescription>Dữ liệu lấy trực tiếp từ API seller</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!shop ? (
              <p className="text-sm text-muted-foreground">Bạn chưa có shop. Vui lòng đăng ký bán hàng để bắt đầu.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Tên shop</p>
                  <p className="font-medium">{shop.shopName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trạng thái</p>
                  <div className="mt-1">{getShopStatusBadge(shop.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Đánh giá trung bình</p>
                  <p className="font-medium">{shop.ratingAvg?.toFixed(1) ?? "0.0"} / 5 ({shop.reviewCount ?? 0} đánh giá)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tổng doanh số</p>
                  <p className="font-medium">{shop.totalSales?.toLocaleString("vi-VN") ?? 0}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-muted-foreground">Mô tả</p>
                  <p className="font-medium">{shop.description || "Chưa có mô tả"}</p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link href="/seller/orders">
                  <Package className="h-4 w-4 mr-2" />
                  Quản lý đơn hàng
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/customer/wallet">
                  <Wallet className="h-4 w-4 mr-2" />
                  Ví tiền
                </Link>
              </Button>
              <Button asChild>
                <Link href="/seller">
                  <Store className="h-4 w-4 mr-2" />
                  Về dashboard seller
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
