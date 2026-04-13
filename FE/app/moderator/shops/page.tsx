"use client";

import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { shopService, Shop } from "@/lib/services/shop.service";
import { toast } from "sonner";
import {
  Store,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  Star,
  ShoppingBag,
  Eye,
  MessageCircle,
} from "lucide-react";

export default function ModeratorShopsPage() {
  const [pendingShops, setPendingShops] = useState<Shop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  // Dialog states
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | "view" | null>(null);
  const [moderatorNote, setModeratorNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendingShops();
  }, []);

  const fetchPendingShops = async () => {
    try {
      setIsLoading(true);
      const shops = await shopService.getPendingShops();
      setPendingShops(shops);
    } catch (error) {
      console.error("Error fetching pending shops:", error);
      toast.error("Lỗi khi tải danh sách shop");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedShop) return;

    try {
      setIsSubmitting(true);
      await shopService.approveShop(selectedShop._id, {
        moderatorNote: moderatorNote || undefined,
      });
      toast.success("Đã phê duyệt shop thành công");
      setPendingShops((prev) => prev.filter((s) => s._id !== selectedShop._id));
      closeDialog();
    } catch (error) {
      console.error("Error approving shop:", error);
      toast.error("Lỗi khi phê duyệt shop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedShop) return;

    try {
      setIsSubmitting(true);
      await shopService.rejectShop(selectedShop._id, {
        moderatorNote: moderatorNote || undefined,
      });
      toast.success("Đã từ chối shop");
      setPendingShops((prev) => prev.filter((s) => s._id !== selectedShop._id));
      closeDialog();
    } catch (error) {
      console.error("Error rejecting shop:", error);
      toast.error("Lỗi khi từ chối shop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDialog = (shop: Shop, action: "approve" | "reject" | "view") => {
    setSelectedShop(shop);
    setDialogAction(action);
    setModeratorNote("");
  };

  const closeDialog = () => {
    setSelectedShop(null);
    setDialogAction(null);
    setModeratorNote("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: Shop["status"]) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case "Active":
        return <Badge variant="default">Hoạt động</Badge>;
      case "Suspended":
        return <Badge variant="destructive">Tạm ngưng</Badge>;
      case "Closed":
        return <Badge variant="outline">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Quản lý Shop
          </h1>
          <p className="text-sm text-muted-foreground">
            Phê duyệt và quản lý các đơn đăng ký bán hàng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="mr-1 h-4 w-4" />
            {pendingShops.length} chờ duyệt
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold text-orange-600">
              {pendingShops.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Đơn đăng ký mới
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-9">
          <TabsTrigger value="pending" className="text-xs sm:text-sm">
            Chờ duyệt ({pendingShops.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Tất cả
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card className="py-4">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base">Đơn đăng ký chờ duyệt</CardTitle>
              <CardDescription className="text-xs">
                Xem xét và phê duyệt các đơn đăng ký bán hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : pendingShops.length === 0 ? (
                <div className="text-center py-8">
                  <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Không có đơn đăng ký nào chờ duyệt
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingShops.map((shop) => (
                    <div
                      key={shop._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <Store className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          <h3 className="font-semibold text-base truncate">
                            {shop.shopName}
                          </h3>
                          {getStatusBadge(shop.status)}
                        </div>
                        {shop.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {shop.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(shop.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {shop.ratingAvg.toFixed(1)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3 text-blue-500" />
                            {shop.responseRate ?? 0}% phản hồi
                          </span>
                          <span className="flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            {shop.totalSales} đơn
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDialog(shop, "view")}
                        >
                          <Eye className="mr-1 h-4 w-4" />
                          Xem
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => openDialog(shop, "approve")}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Duyệt
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDialog(shop, "reject")}
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Tab */}
        <TabsContent value="all">
          <Card className="py-4">
            <CardHeader className="px-4 pt-4 pb-3">
              <CardTitle className="text-base">Tất cả Shop</CardTitle>
              <CardDescription className="text-xs">
                Danh sách tất cả shop trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-center py-8">
                <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Tính năng đang phát triển
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={dialogAction === "view"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết Shop</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn đăng ký bán hàng
            </DialogDescription>
          </DialogHeader>
          {selectedShop && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tên Shop</Label>
                <p className="text-sm">{selectedShop.shopName}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mô tả</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedShop.description || "Không có mô tả"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Trạng thái</Label>
                  <div>{getStatusBadge(selectedShop.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ngày đăng ký</Label>
                  <p className="text-sm">{formatDate(selectedShop.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Đóng
            </Button>
            <Button
              variant="default"
              onClick={() => {
                closeDialog();
                if (selectedShop) openDialog(selectedShop, "approve");
              }}
            >
              Phê duyệt
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                closeDialog();
                if (selectedShop) openDialog(selectedShop, "reject");
              }}
            >
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={dialogAction === "approve"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Phê duyệt Shop</DialogTitle>
            <DialogDescription>
              Xác nhận phê duyệt shop "{selectedShop?.shopName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="note"
                placeholder="Nhập ghi chú cho người bán..."
                value={moderatorNote}
                onChange={(e) => setModeratorNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button onClick={handleApprove} disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : "Xác nhận phê duyệt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={dialogAction === "reject"} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Từ chối Shop</DialogTitle>
            <DialogDescription>
              Xác nhận từ chối shop "{selectedShop?.shopName}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-note">Lý do từ chối</Label>
              <Textarea
                id="reject-note"
                placeholder="Nhập lý do từ chối..."
                value={moderatorNote}
                onChange={(e) => setModeratorNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận từ chối"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
