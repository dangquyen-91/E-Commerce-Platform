"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  RefreshCw,
  Inbox,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { complaintService } from "@/lib/services/complaint.service";
import type { Complaint } from "@/lib/services/complaint.service";

// Status badge config
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_SELLER: { label: "Chờ seller", variant: "secondary" },
  SELLER_APPROVED: { label: "Seller đồng ý", variant: "default" },
  SELLER_REJECTED: { label: "Seller từ chối", variant: "destructive" },
  AUTO_ESCALATED: { label: "Tự động leo thang", variant: "destructive" },
  MODERATOR_REVIEW: { label: "Đang xử lý", variant: "default" },
  RESOLVED_REFUNDED: { label: "Đã hoàn tiền", variant: "outline" },
  CLOSED_REJECTED: { label: "Đã từ chối", variant: "outline" },
  APPEAL_FILED: { label: "Đang kháng cáo", variant: "secondary" },
  APPEAL_REVIEW: { label: "Xem xét kháng cáo", variant: "default" },
  APPEAL_CLOSED: { label: "Kháng cáo kết thúc", variant: "outline" },
};

const categoryLabels: Record<string, string> = {
  ProductQuality: "Chất lượng SP",
  NotAsDescribed: "Không đúng mô tả",
  MissingWrongItems: "Thiếu/sai hàng",
  DeliveryIssues: "Vấn đề giao hàng",
  AccountNotWorking: "TK không hoạt động",
  SellerNotResponding: "Seller không phản hồi",
  RefundDispute: "Tranh chấp hoàn tiền",
};

interface Stats {
  total: number;
  pendingSeller: number;
  moderatorReview: number;
  resolved: number;
}

export default function ModeratorComplaintsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pendingSeller: 0, moderatorReview: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const result = await complaintService.getAllComplaints({
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: itemsPerPage,
        skip: (currentPage - 1) * itemsPerPage,
      });

      setComplaints(result.tickets);
      setTotalItems(result.total);

      // Set basic stats from total
      setStats({
        total: result.total,
        pendingSeller: 0,
        moderatorReview: 0,
        resolved: 0,
      });
    } catch (error: any) {
      console.error("Failed to fetch complaints:", error);
      console.error("Error details:", {
        message: error?.message,
        status: error?.status,
        response: error?.response,
        name: error?.name,
        stack: error?.stack,
      });

      // Try to extract error message from various formats
      let errorMsg = "Không thể tải danh sách khiếu nại";
      if (error?.message) {
        errorMsg = error.message;
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (typeof error === "string") {
        errorMsg = error;
      }

      // Show status code if available
      if (error?.status === 403) {
        errorMsg = "Bạn không có quyền truy cập danh sách khiếu nại. Vui lòng liên hệ admin.";
      } else if (error?.status === 401) {
        errorMsg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
      }

      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handleViewComplaint = (complaint: Complaint) => {
    router.push(`/moderator/complaints/${complaint._id}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/moderator">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Xử lý khiếu nại
            </h1>
            <p className="text-sm text-muted-foreground">
              Xem và xử lý khiếu nại từ khách hàng
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchComplaints}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Tổng khiếu nại</CardTitle>
            <FileText className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.total}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Tất cả
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Chờ seller</CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingSeller}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Đang chờ phản hồi
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Cần xử lý</CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {stats.moderatorReview}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Chờ moderator
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
            <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats.resolved}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Hoàn thành
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="py-4">
        <CardHeader className="px-4 pt-4 pb-3">
          <CardTitle className="text-base">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trạng thái:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="PENDING_SELLER">Chờ seller</SelectItem>
                  <SelectItem value="MODERATOR_REVIEW">Đang xử lý</SelectItem>
                  <SelectItem value="AUTO_ESCALATED">Tự động leo thang</SelectItem>
                  <SelectItem value="RESOLVED_REFUNDED">Đã hoàn tiền</SelectItem>
                  <SelectItem value="CLOSED_REJECTED">Đã từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <Card className="py-4">
        <CardHeader className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base">Danh sách khiếu nại</CardTitle>
              <CardDescription className="text-xs">
                Hiển thị {complaints.length} / {totalItems} khiếu nại
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không có khiếu nại</h3>
              <p className="text-sm text-muted-foreground">
                {statusFilter !== "all"
                  ? "Không có khiếu nại nào với trạng thái này"
                  : "Chưa có khiếu nại nào trong hệ thống"
                }
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {complaints.map((complaint) => {
                  const status = statusConfig[complaint.status] || {
                    label: complaint.status,
                    variant: "outline" as const
                  };

                  return (
                    <div
                      key={complaint._id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {complaint.ticketCode}
                          </span>
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                          {complaint.isAppeal && (
                            <Badge variant="outline" className="text-xs border-purple-500 text-purple-500">
                              Kháng cáo
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm truncate">
                          {complaint.title}
                        </p>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {complaint.category && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {categoryLabels[complaint.category] || complaint.category}
                            </span>
                          )}
                          <span>
                            Giá trị: {formatPrice(complaint.orderValue || 0)}
                          </span>
                          <span>
                            Ngày tạo: {formatDate(complaint.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleViewComplaint(complaint)}
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
