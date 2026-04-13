"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";
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
import {
  CheckCircle,
  Mail,
  ShoppingBag,
  ArrowRight,
  Package,
  Phone,
  Calendar,
  Edit,
  Wallet,
  Star,
} from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Link from "next/link";
import { orderService } from "@/lib/services/order.service";
import { authService } from "@/lib/services/auth.service";
import type { Order } from "@/types";

interface CustomerStats {
  totalOrders: number;
  pendingOrders: number;
  walletBalance: number;
  supportTickets: number;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getRoleText(role: string): string {
  const map: Record<string, string> = {
    customer: "Khách hàng",
    seller: "Người bán",
    moderator: "Moderator",
    admin: "Admin",
  };
  return map[role] || role;
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case "Pending":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Chờ thanh toán</Badge>;
    case "Paid":
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Đã thanh toán</Badge>;
    case "Processing":
      return <Badge variant="outline" className="border-purple-500 text-purple-600">Đang xử lý</Badge>;
    case "Completed":
      return <Badge variant="outline" className="border-green-500 text-green-600">Hoàn thành</Badge>;
    case "Cancelled":
      return <Badge variant="outline" className="border-red-500 text-red-600">Đã hủy</Badge>;
    case "Refunded":
      return <Badge variant="outline" className="border-gray-500 text-gray-600">Hoàn tiền</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function CustomerProfilePage() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [totalOrders, setTotalOrders] = useState(0);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingOrders(true);
        setIsLoadingStats(true);

        const [ordersResponse, statsResponse] = await Promise.all([
          orderService.getMyOrders({ limit: 5, page: 1 }),
          authService.getCustomerStats(),
        ]);

        setOrders(ordersResponse.orders);
        setTotalOrders(ordersResponse.pagination.total);
        setStats(statsResponse);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoadingOrders(false);
        setIsLoadingStats(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const initials = getInitials(user.name);
  const roleText = getRoleText(user.role);

  return (
    <RequireAuth>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div>
                    <h1 className="text-2xl font-bold">{user.name}</h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-muted-foreground mt-1 justify-center sm:justify-start">
                      <div className="flex items-center gap-1 justify-center sm:justify-start">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 justify-center sm:justify-start">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
                    {user.emailVerified && (
                      <Badge variant="secondary" className="flex items-center gap-1 bg-green-100 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        Đã xác minh
                      </Badge>
                    )}
                    <Badge variant="secondary">{roleText}</Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center sm:justify-start">
                    <Calendar className="h-3 w-3" />
                    <span>Tham gia: {new Date(user.createdAt).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>

                <Button variant="outline" asChild>
                  <Link href="/customer/profile/edit">
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-7 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600">{stats?.totalOrders ?? 0}</p>
                    )}
                  </div>
                  <ShoppingBag className="h-8 w-8 text-green-600/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Đang xử lý</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-7 w-12 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-orange-600">{stats?.pendingOrders ?? 0}</p>
                    )}
                  </div>
                  <Package className="h-8 w-8 text-orange-600/20" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Số dư ví</p>
                    {isLoadingStats ? (
                      <Skeleton className="h-7 w-20 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-blue-600">
                        {(stats?.walletBalance ?? 0).toLocaleString("vi-VN")}đ
                      </p>
                    )}
                  </div>
                  <Wallet className="h-8 w-8 text-blue-600/20" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/orders">
                <ShoppingBag className="h-5 w-5" />
                <span className="text-xs">Đơn hàng của tôi</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/wallet">
                <Wallet className="h-5 w-5" />
                <span className="text-xs">Ví tiền</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/complaints">
                <Star className="h-5 w-5" />
                <span className="text-xs">Khiếu nại</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto py-4 flex-col gap-2">
              <Link href="/customer/profile/edit">
                <Edit className="h-5 w-5" />
                <span className="text-xs">Chỉnh sửa hồ sơ</span>
              </Link>
            </Button>
          </div>

          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Đơn hàng gần đây</CardTitle>
                <CardDescription>
                  {totalOrders > 0 ? `Bạn có ${totalOrders} đơn hàng` : "Danh sách đơn hàng của bạn"}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/customer/orders">
                  Xem tất cả
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingOrders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào</p>
                  <Button variant="link" asChild className="mt-2">
                    <Link href="/products">Khám phá sản phẩm</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/customer/orders/${order.id}`}
                      className="block"
                    >
                      <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">#{order.orderCode}</span>
                            {getOrderStatusBadge(order.status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {order.payableAmount.toLocaleString("vi-VN")} VND
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.orderItems?.length || 0} sản phẩm
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}

                  {totalOrders > 5 && (
                    <div className="text-center pt-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href="/customer/orders">
                          Xem thêm {totalOrders - 5} đơn hàng khác
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}
