"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Clock,
  HandCoins,
  RefreshCw,
  Search,
  ShieldCheck,
  Timer,
} from "lucide-react";

import { disbursementService } from "@/lib/services/disbursement.service";
import type { DisbursementStats, HoldingItem, PendingItem } from "@/types/disbursement";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

function formatVND(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function safeIncludes(value: string | undefined | null, query: string) {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function getHoldingStatusBadge(item: HoldingItem) {
  if (item.hasOpenComplaint) {
    return <Badge variant="destructive">Bị chặn (khiếu nại)</Badge>;
  }

  if (item.isReadyForDisbursement) {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        Sẵn sàng
      </Badge>
    );
  }

  return <Badge variant="secondary">Đang giữ</Badge>;
}

export default function DisbursementPage() {
  const [stats, setStats] = useState<DisbursementStats | null>(null);
  const [holdingItems, setHoldingItems] = useState<HoldingItem[]>([]);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"holding" | "ready">("holding");
  const [searchQuery, setSearchQuery] = useState("");

  const query = searchQuery.trim().toLowerCase();

  const filteredHoldingItems = useMemo(() => {
    if (!query) return holdingItems;
    return holdingItems.filter((item) => {
      return (
        safeIncludes(item.orderCode, query) ||
        safeIncludes(item.customerEmail, query) ||
        safeIncludes(item.shopName, query)
      );
    });
  }, [holdingItems, query]);

  const filteredPendingItems = useMemo(() => {
    if (!query) return pendingItems;
    return pendingItems.filter((item) => {
      return (
        safeIncludes(item.orderCode, query) ||
        safeIncludes(item.customerEmail, query) ||
        safeIncludes(item.shopName, query)
      );
    });
  }, [pendingItems, query]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, holdingData, pendingData] = await Promise.all([
        disbursementService.getStats(),
        disbursementService.getHolding({ limit: 20 }),
        disbursementService.getPending({ limit: 20 }),
      ]);

      setStats(statsData);
      setHoldingItems(holdingData.items);
      setPendingItems(pendingData.items);
    } catch (error) {
      console.error("Error fetching disbursement data:", error);
      toast.error("Không thể tải dữ liệu giải ngân");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDisburse = async (itemId: string) => {
    try {
      setProcessingId(itemId);
      const result = await disbursementService.triggerDisbursement(itemId);

      if (result.success) {
        toast.success(result.message || "Giải ngân thành công");
        await fetchData();
      } else {
        toast.error(result.message || "Giải ngân thất bại");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi thực hiện giải ngân");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Giải ngân</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý Escrow 72h và release tiền cho Seller
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={"mr-2 h-4 w-4 " + (loading ? "animate-spin" : "")} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-primary" />
              Đang giữ (Escrow)
            </CardTitle>
            <CardDescription>Số tiền đang hold</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-2/3" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {formatVND(stats?.holding.totalAmount || 0)}
              </div>
            )}
            {!loading && (
              <div className="mt-2 text-xs text-muted-foreground">
                {stats?.holding.count || 0} item đang giữ
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Timer className="h-4 w-4 text-emerald-600" />
              Sẵn sàng giải ngân
            </CardTitle>
            <CardDescription>Qua 72h và không có khiếu nại</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {stats?.readyForDisbursement || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              30 ngày: Đã release
            </CardTitle>
            <CardDescription>Tổng tiền đã release</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-2/3" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {formatVND(stats?.releasedLast30Days.totalAmount || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              30 ngày: Hoàn tiền
            </CardTitle>
            <CardDescription>Tổng tiền đã hoàn</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-2/3" />
            ) : (
              <div className="text-2xl font-bold tabular-nums text-destructive">
                {formatVND(stats?.refundedLast30Days.totalAmount || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs + Search */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="holding">Holding Items</TabsTrigger>
                <TabsTrigger value="ready">Ready to Release</TabsTrigger>
              </TabsList>

              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm orderCode, email, shopName..."
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <TabsContent value="holding" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn / Item</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Thời gian giữ</TableHead>
                      <TableHead className="text-right">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={5}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredHoldingItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-48">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Clock className="h-10 w-10" />
                            <div className="text-sm">Không có dữ liệu holding</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredHoldingItems.map((item) => (
                        <TableRow key={item.orderItemId}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.orderCode}</span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {item.productTitle}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.shopName}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.customerEmail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatVND(item.holdAmount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{item.timeRemainingFormatted}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {getHoldingStatusBadge(item)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="ready" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Shop</TableHead>
                      <TableHead>Sản phẩm</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Đã giữ</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-10 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : filteredPendingItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-48">
                          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <HandCoins className="h-10 w-10" />
                            <div className="text-sm">Không có item sẵn sàng giải ngân</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPendingItems.map((item) => (
                        <TableRow key={item.orderItemId}>
                          <TableCell className="font-medium">{item.orderCode}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{item.shopName}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.customerEmail}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.productTitle}</span>
                          </TableCell>
                          <TableCell className="tabular-nums font-medium">
                            {formatVND(item.holdAmount)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{item.hoursHeld} giờ</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {item.hasOpenComplaint && (
                                <Badge variant="destructive">Bị chặn</Badge>
                              )}
                              <Button
                                size="sm"
                                disabled={!item.canDisburse || processingId === item.orderItemId}
                                onClick={() => handleDisburse(item.orderItemId)}
                              >
                                {processingId === item.orderItemId ? (
                                  <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Đang xử lý
                                  </>
                                ) : (
                                  "Giải ngân"
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      {/* Info */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Cơ chế Escrow 72h
          </CardTitle>
          <CardDescription>
            Tiền được giữ trong 72 giờ trước khi auto-release; có thể bị chặn nếu có khiếu nại.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Hệ thống tự động giữ tiền (holdBalance) trong vòng 72 giờ kể từ khi đơn hàng được giao.
          Admin có quyền can thiệp giải ngân sớm hoặc giữ tiền lâu hơn nếu có khiếu nại.
          Phí platform (5%) sẽ được khấu trừ trực tiếp khi giải ngân thành công.
        </CardContent>
      </Card>
    </div>
  );
}
