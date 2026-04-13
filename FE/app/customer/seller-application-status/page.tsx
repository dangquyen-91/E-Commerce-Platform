"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Store,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { shopService, Shop } from "@/lib/services/shop.service";

const SHOP_STATUS_LABELS: Record<string, string> = {
  Pending: "Chờ duyệt",
  Active: "Đang hoạt động",
  Suspended: "Tạm ngưng",
  Closed: "Đã đóng",
};

const SHOP_STATUS_COLORS: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Active: "bg-green-100 text-green-800 border-green-200",
  Suspended: "bg-orange-100 text-orange-800 border-orange-200",
  Closed: "bg-red-100 text-red-800 border-red-200",
};

const SHOP_STATUS_ICONS: Record<string, React.ReactNode> = {
  Pending: <Clock className="h-4 w-4" />,
  Active: <CheckCircle className="h-4 w-4" />,
  Suspended: <AlertCircle className="h-4 w-4" />,
  Closed: <XCircle className="h-4 w-4" />,
};

export default function SellerApplicationStatusPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState<Shop | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      setLoading(true);
      const myShop = await shopService.getMyShop();
      setShop(myShop);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Không thể tải thông tin shop");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-muted-foreground">Đang tải thông tin...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (error && !shop) {
    return (
      <RequireAuth>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={loadShop} className="mt-4">
                  Thử lại
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    );
  }

  if (!shop) {
    return (
      <RequireAuth>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Store className="h-6 w-6 text-primary" />
                  Trạng thái đơn đăng ký làm người bán hàng
                </CardTitle>
                <CardDescription>
                  Bạn chưa có đơn đăng ký làm người bán hàng nào
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push("/seller/register")}>
                  Đăng ký làm người bán hàng
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </RequireAuth>
    );
  }

  const statusLabel = SHOP_STATUS_LABELS[shop.status] || shop.status;
  const statusColor = SHOP_STATUS_COLORS[shop.status] || "bg-gray-100 text-gray-800";
  const statusIcon = SHOP_STATUS_ICONS[shop.status];

  return (
    <RequireAuth>
      <div className="container py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Store className="h-6 w-6 text-primary" />
                Trạng thái đơn đăng ký làm người bán hàng
              </CardTitle>
              <CardDescription>
                Theo dõi trạng thái đơn đăng ký shop của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Shop Info */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Tên shop
                  </Label>
                  <p className="text-lg font-semibold mt-1">{shop.shopName}</p>
                </div>

                {shop.description && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Mô tả
                    </Label>
                    <p className="text-sm mt-1">{shop.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Trạng thái
                  </Label>
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className={`${statusColor} border flex items-center gap-1 w-fit`}
                    >
                      {statusIcon}
                      {statusLabel}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {shop.status === "Pending" && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    Đơn đăng ký của bạn đang chờ moderator xem xét và duyệt. Vui lòng chờ trong
                    giây lát.
                  </AlertDescription>
                </Alert>
              )}

              {shop.status === "Active" && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    Chúc mừng! Shop của bạn đã được duyệt và đang hoạt động. Bạn có thể bắt đầu
                    bán hàng ngay bây giờ.
                  </AlertDescription>
                </Alert>
              )}

              {shop.status === "Closed" && (
                <div className="space-y-4">
                  <Alert variant="destructive" className="border-2">
                    <XCircle className="h-5 w-5" />
                    <AlertDescription className="ml-2">
                      <p className="font-semibold text-base">Đơn đăng ký của bạn đã bị từ chối</p>
                      {shop.moderatorNote && (
                        <div className="mt-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">
                            Lý do từ chối:
                          </p>
                          <p className="text-sm text-red-800 dark:text-red-300">{shop.moderatorNote}</p>
                        </div>
                      )}
                      <p className="mt-3 text-sm">
                        Bạn có thể sửa thông tin và đăng ký lại bằng cách nhấn nút bên dưới.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {/* Prominent re-register button */}
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={() => router.push("/seller/register?reregister=true")}
                  >
                    Đăng ký lại làm người bán hàng
                  </Button>
                </div>
              )}

              {shop.status === "Suspended" && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-900">
                    Shop của bạn đã bị tạm ngưng hoạt động.
                    {shop.moderatorNote && (
                      <div className="mt-2 p-3 bg-orange-100 rounded-md">
                        <p className="text-sm font-medium text-orange-900 mb-1">
                          Ghi chú từ moderator:
                        </p>
                        <p className="text-sm text-orange-800">{shop.moderatorNote}</p>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Moderator Note */}
              {shop.moderatorNote && shop.status !== "Closed" && shop.status !== "Suspended" && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Ghi chú từ moderator:
                  </p>
                  <p className="text-sm text-blue-800">{shop.moderatorNote}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t">
                {shop.status === "Active" && (
                  <Button onClick={() => router.push("/seller")}>
                    Quản lý Shop
                  </Button>
                )}
                {shop.status === "Pending" && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/seller/register")}
                  >
                    Cập nhật thông tin
                  </Button>
                )}
                {/* Note: Re-register button for Closed status is shown above in the rejection section */}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
                <p>Ngày tạo: {new Date(shop.createdAt).toLocaleString("vi-VN")}</p>
                {shop.approvedAt && (
                  <p>Ngày duyệt: {new Date(shop.approvedAt).toLocaleString("vi-VN")}</p>
                )}
                <p>Cập nhật lần cuối: {new Date(shop.updatedAt).toLocaleString("vi-VN")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RequireAuth>
  );
}

// Label component helper
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block ${className || ""}`}>{children}</label>;
}
