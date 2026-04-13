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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  ShoppingCart,
  Package,
  Wallet,
  MessageSquare,
  Star,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  FileText,
} from "lucide-react";
import { paymentService } from "@/lib/services/payment.service";
import { orderService } from "@/lib/services/order.service";
import { ticketService } from "@/lib/services/ticket.service";
import { reviewService } from "@/lib/services/review.service";
import { toast } from "sonner";

interface CustomerStats {
  totalOrders: number;
  activeOrders: number;
  totalSpent: number;
  walletBalance: number;
  pendingTickets: number;
  reviewsGiven: number;
}

interface RecentOrder {
  id: string;
  product: string;
  amount: number;
  status: string;
  date: string;
  shop: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats>({
    totalOrders: 0,
    activeOrders: 0,
    totalSpent: 0,
    walletBalance: 0,
    pendingTickets: 0,
    reviewsGiven: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch wallet balance
        const walletBalance = await paymentService.getWalletBalance();
        
        // Update stats with wallet balance
        setStats((prev) => ({
          ...prev,
          walletBalance: walletBalance.balance,
        }));

        // Fetch orders, tickets, reviews when BE APIs are available
        try {
          const [ordersRes, ticketsRes, reviewsRes] = await Promise.all([
            orderService.getMyOrders({ limit: 5 }).catch(() => ({ orders: [], pagination: { total: 0 } })),
            ticketService.getMyTickets({ status: "open" }).catch(() => ({ tickets: [], pagination: { total: 0 } })),
            reviewService.getMyReviews().catch(() => []),
          ]);
          
          // Calculate stats from fetched data
          const totalOrders = ordersRes.pagination?.total || 0;
          const activeOrders = ordersRes.orders?.filter((o: any) => 
            o.status !== "completed" && o.status !== "cancelled"
          ).length || 0;
          const totalSpent = ordersRes.orders?.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0) || 0;
          const pendingTickets = ticketsRes.pagination?.total || 0;
          const reviewsGiven = Array.isArray(reviewsRes) ? reviewsRes.length : (reviewsRes as any)?.pagination?.total || 0;
          
          setStats({
            totalOrders,
            activeOrders,
            totalSpent,
            walletBalance: walletBalance.balance,
            pendingTickets,
            reviewsGiven,
          });
          
          // Map orders to recent orders format
          if (ordersRes.orders && ordersRes.orders.length > 0) {
            setRecentOrders(ordersRes.orders.slice(0, 5).map((order: any) => ({
              id: order.id || order._id,
              product: order.orderItems?.[0]?.product?.title || "N/A",
              amount: order.totalAmount || order.payableAmount || 0,
              status: order.status,
              date: new Date(order.createdAt).toLocaleDateString("vi-VN"),
              shop: order.orderItems?.[0]?.shop?.shopName || "N/A",
            })));
          }
        } catch (error) {
          // If APIs are not available yet, keep default values
        }
      } catch (error: any) {
        console.error("Failed to fetch customer data:", error);
        toast.error("Không thể tải dữ liệu. Vui lòng thử lại sau.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <RequireAuth requiredRole="customer">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 lg:py-10 space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Dashboard Khách hàng
            </h1>
            <p className="text-base md:text-lg text-muted-foreground">
              Quản lý đơn hàng, ví tiền và hỗ trợ của bạn
            </p>
          </div>
          <Button size="lg" className="h-11 md:h-12 text-base md:text-lg" asChild>
            <Link href="/products">
              <Plus className="mr-2 h-5 w-5" />
              Mua sắm
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base md:text-lg font-medium">
                Tổng đơn hàng
              </CardTitle>
              <Package className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <>
                  <div className="text-3xl md:text-4xl font-bold">
                    {stats.totalOrders}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    {stats.activeOrders} đang xử lý
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base md:text-lg font-medium">
                Tổng chi tiêu
              </CardTitle>
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <>
                  <div className="text-3xl md:text-4xl font-bold text-green-600">
                    {formatPrice(stats.totalSpent)}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    Tất cả thời gian
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base md:text-lg font-medium">
                Số dư ví
              </CardTitle>
              <Wallet className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600">
                    {formatPrice(stats.walletBalance)}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    <Link
                      href="/customer/wallet"
                      className="text-primary hover:underline"
                    >
                      Nạp tiền
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base md:text-lg font-medium">
                Khiếu nại
              </CardTitle>
              <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <>
                  <div className="text-3xl md:text-4xl font-bold text-orange-600">
                    {stats.pendingTickets}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    <Link
                      href="/customer/complaints"
                      className="text-primary hover:underline"
                    >
                      Xem tất cả
                    </Link>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Thao tác nhanh</CardTitle>
            <CardDescription>Các chức năng thường dùng</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-auto py-6 flex-col" asChild>
                <Link href="/customer/orders">
                  <Package className="h-6 w-6 mb-2" />
                  <span>Đơn hàng</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col" asChild>
                <Link href="/customer/wallet">
                  <Wallet className="h-6 w-6 mb-2" />
                  <span>Ví tiền</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col" asChild>
                <Link href="/customer/complaints">
                  <AlertCircle className="h-6 w-6 mb-2" />
                  <span>Khiếu nại</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-6 flex-col" asChild>
                <Link href="/customer/tickets/create">
                  <FileText className="h-6 w-6 mb-2" />
                  <span>Tạo khiếu nại</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
            <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
            <TabsTrigger value="tickets">Khiếu nại</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Đơn hàng gần đây</CardTitle>
                    <CardDescription>5 đơn hàng mới nhất của bạn</CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/customer/orders">Xem tất cả</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Chưa có đơn hàng nào. Bắt đầu mua sắm ngay!
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/products">Khám phá sản phẩm</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{order.product}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              {order.id}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {order.date}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {order.shop}
                            </span>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "paid"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {order.status === "completed"
                                ? "Hoàn tất"
                                : order.status === "paid"
                                ? "Đã thanh toán"
                                : "Chờ thanh toán"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg">
                            {formatPrice(order.amount)}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customer/orders/${order.id}`}>
                              Xem chi tiết
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Wallet Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ví tiền</CardTitle>
                    <CardDescription>Số dư và giao dịch gần đây</CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/customer/wallet">Xem chi tiết</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-24 w-full" />
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">Số dư khả dụng</p>
                        <p className="text-2xl font-bold">
                          {formatPrice(stats.walletBalance)}
                        </p>
                      </div>
                      <Button asChild>
                        <Link href="/customer/wallet">Nạp tiền</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Tất cả đơn hàng</CardTitle>
                    <CardDescription>Lịch sử mua hàng của bạn</CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/customer/orders">Xem tất cả</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Chưa có đơn hàng nào. Bắt đầu mua sắm ngay!
                    </p>
                    <Button className="mt-4" asChild>
                      <Link href="/products">Khám phá sản phẩm</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{order.product}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-sm text-muted-foreground">
                              {order.id}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {order.date}
                            </span>
                            <Badge
                              variant={
                                order.status === "completed"
                                  ? "default"
                                  : order.status === "paid"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {order.status === "completed"
                                ? "Hoàn tất"
                                : order.status === "paid"
                                ? "Đã thanh toán"
                                : "Chờ thanh toán"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-lg">
                            {formatPrice(order.amount)}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/customer/orders/${order.id}`}>
                              Xem chi tiết
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Đánh giá của tôi</CardTitle>
                    <CardDescription>
                      {stats.reviewsGiven} đánh giá đã đăng
                    </CardDescription>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/customer/reviews">Xem tất cả</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Bạn chưa có đánh giá nào. Hãy đánh giá sản phẩm sau khi nhận
                    hàng!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Khiếu nại</CardTitle>
                    <CardDescription>
                      Quản lý khiếu nại về sản phẩm
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild>
                      <Link href="/customer/complaints">
                        <Eye className="mr-2 h-4 w-4" />
                        Xem tất cả
                      </Link>
                    </Button>
                    <Button asChild>
                      <Link href="/customer/tickets/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo khiếu nại
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Gặp vấn đề với sản phẩm? Tạo khiếu nại để được hỗ trợ.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" asChild>
                      <Link href="/customer/complaints">Xem khiếu nại</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/customer/tickets/create">Tạo khiếu nại mới</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RequireAuth>
  );
}
