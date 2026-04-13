"use client";

import { useEffect, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { orderService, type SellerOrderItem } from "@/lib/services/order.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Phone, Mail, Clock, Shield, Copy } from "lucide-react";
import { toast } from "sonner";

// Debug logger
const LOG_PREFIX = "[SellerOrders]";
const debug = {
  log: (...args: unknown[]) => console.log(LOG_PREFIX, ...args),
  error: (...args: unknown[]) => console.error(LOG_PREFIX, ...args),
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("vi-VN");
};

export default function SellerOrdersPage() {
  const [items, setItems] = useState<SellerOrderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCredentials, setVisibleCredentials] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      debug.log("Fetching seller order items...");
      try {
        const res = await orderService.getSellerOrderItems({ limit: 100 });
        debug.log("Fetched seller order items", { count: res.items.length, pagination: res.pagination });
        setItems(res.items);
      } catch (error: any) {
        debug.error("Failed to fetch seller order items", {
          message: error?.message || "Unknown error",
          status: error?.status,
          raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
        toast.error(error?.message || "Không thể tải danh sách đơn hàng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <RequireAuth requiredRole="seller">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold">Lịch sử bán hàng</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Xem lại các đơn hàng đã bán để hỗ trợ xử lý tranh chấp với khách.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Đơn hàng theo item</CardTitle>
            <CardDescription>
              Mỗi dòng là một item đã bán (liên kết với một key/tài khoản trong inventory).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có đơn hàng nào.</p>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Giá / SL</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Bảo hành</TableHead>
                      <TableHead>Key đã giao</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const isWarrantyActive = item.safeUntil && new Date(item.safeUntil) > new Date();

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs md:text-sm">
                            <div className="space-y-0.5">
                              <div>{item.orderCode || "-"}</div>
                              <div className="text-muted-foreground text-[10px]">
                                ID: {item.orderId?.slice(-8) || "-"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{formatDateTime(item.orderCreatedAt)}</span>
                              </div>
                              {item.deliveredAt && (
                                <div className="text-muted-foreground text-[10px]">
                                  Giao: {formatDateTime(item.deliveredAt)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.customer ? (
                              <div className="space-y-1">
                                <div className="font-medium">{item.customer.fullName || "N/A"}</div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  <span className="text-[11px]">{item.customer.email}</span>
                                </div>
                                {item.customer.phone && (
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    <span className="text-[11px]">{item.customer.phone}</span>
                                  </div>
                                )}
                                <div className="text-muted-foreground text-[10px]">
                                  ID: {item.customer.id?.slice(-8) || "-"}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.product ? (
                              <div className="flex items-center gap-3">
                                {item.product.thumbnailUrl && (
                                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted border">
                                    <img
                                      src={item.product.thumbnailUrl}
                                      alt={item.product.title}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="space-y-0.5">
                                  <div className="font-medium line-clamp-2">{item.product.title}</div>
                                  <div className="text-muted-foreground text-[11px] md:text-xs">
                                    {item.product.planType} • {item.product.durationDays} ngày
                                  </div>
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <div className="space-y-0.5">
                              <div>{formatPrice(item.unitPrice)}</div>
                              <div className="text-muted-foreground text-[11px] md:text-xs">
                                SL: {item.quantity} • Tổng: {formatPrice(item.subtotal)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            <div className="flex flex-col gap-1">
                              <Badge variant="outline" className="w-fit">
                                {item.itemStatus}
                              </Badge>
                              <Badge variant="outline" className="w-fit text-[11px]">
                                {item.holdStatus} • {formatPrice(item.holdAmount)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs md:text-sm">
                            {item.safeUntil ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1">
                                  <Shield className={`h-3 w-3 ${isWarrantyActive ? "text-green-500" : "text-muted-foreground"}`} />
                                  <Badge variant={isWarrantyActive ? "default" : "secondary"} className="text-[10px]">
                                    {isWarrantyActive ? "Còn BH" : "Hết BH"}
                                  </Badge>
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                  Đến: {formatDateTime(item.safeUntil)}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell className="text-xs md:text-sm max-w-xs">
                            {item.credential ? (
                              <div className="space-y-1">
                                {item.secretType && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {item.secretType}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1">
                                  <span className="font-mono break-all text-[11px]">
                                    {visibleCredentials[item.id]
                                      ? item.credential
                                      : "••••••••••••••••"}
                                  </span>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      setVisibleCredentials((prev) => ({
                                        ...prev,
                                        [item.id]: !prev[item.id],
                                      }))
                                    }
                                  >
                                    {visibleCredentials[item.id] ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.credential || "");
                                      toast.success("Đã copy key");
                                    }}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-muted-foreground text-[10px]">
                                  Inv: {item.inventoryItemId?.slice(-8) || "-"}
                                </div>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}

