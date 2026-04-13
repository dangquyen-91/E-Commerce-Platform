"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { orderService } from "@/lib/services/order.service";
import type { Order } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await orderService.getMyOrders({ limit: 50, sort: "createdAt" });
        setOrders(res.orders);
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleString("vi-VN");

  return (
    <RequireAuth>
      <div className="container py-6 md:py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7" />
            Lịch sử đơn hàng
          </h1>
          <p className="text-muted-foreground mt-1">
            Xem và theo dõi các đơn hàng của bạn
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng của bạn</CardTitle>
            <CardDescription>Danh sách đơn hàng đã mua</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">Chưa có đơn hàng nào</p>
                <p className="text-sm text-muted-foreground mb-6">
                  Khi bạn mua sản phẩm, đơn hàng sẽ hiển thị tại đây.
                </p>
                <Button asChild>
                  <Link href="/products" className="inline-flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Mua sản phẩm
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => router.push(`/customer/orders/${order.orderCode}`)}
                    className="w-full text-left border rounded-lg px-4 py-3 hover:bg-muted/60 transition-colors flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-semibold text-sm md:text-base">
                        Đơn hàng #{order.orderCode}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        Ngày đặt: {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm md:text-base font-bold text-primary">
                        {formatPrice(order.payableAmount)}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const raw = (order.status as unknown as string) || "";
                          switch (raw) {
                            case "PendingPayment":
                            case "pending_payment":
                              return "Chờ thanh toán";
                            case "Paid":
                            case "Completed":
                            case "paid":
                            case "completed":
                              return "Thành công";
                            case "Refunded":
                            case "refunded":
                              return "Đã hoàn tiền";
                            case "Cancelled":
                            case "cancelled":
                              return "Đã hủy";
                            default:
                              return "Đang xử lý";
                          }
                        })()}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
