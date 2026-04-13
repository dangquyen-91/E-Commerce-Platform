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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Eye,
  RefreshCw,
  ArrowLeft,
  Search,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { complaintService } from "@/lib/services/complaint.service";
import type { Complaint } from "@/lib/services/complaint.service";

// Status config matched with Swagger
const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; color: string }> = {
  PENDING_SELLER: { label: "Chờ Seller phản hồi", variant: "outline", color: "text-amber-600" },
  SELLER_APPROVED: { label: "Seller đã chấp thuận", variant: "default", color: "text-blue-600" },
  SELLER_REJECTED: { label: "Seller đã từ chối", variant: "destructive", color: "text-red-600" },
  AUTO_ESCALATED: { label: "Tự động chuyển Moderator", variant: "outline", color: "text-orange-600" },
  MODERATOR_REVIEW: { label: "Moderator đang xem xét", variant: "default", color: "text-blue-600" },
  RESOLVED_REFUNDED: { label: "Đã hoàn tiền", variant: "secondary", color: "text-green-600" },
  CLOSED_REJECTED: { label: "Đã đóng (từ chối)", variant: "secondary", color: "text-gray-600" },
};

const categoryLabels: Record<string, string> = {
  ProductQuality: "Chất lượng SP",
  NotAsDescribed: "Không đúng mô tả",
  MissingWrongItems: "Thiếu/Sai hàng",
  DeliveryIssues: "Giao hàng",
  AccountNotWorking: "Lỗi tài khoản",
  SellerNotResponding: "Seller không phản hồi",
  RefundDispute: "Tranh chấp hoàn tiền",
};

export default function CustomerComplaintsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("history");
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const result = await complaintService.getMyComplaints({
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 50,
      });
      setComplaints(result.tickets);
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
      toast.error("Không thể tải lịch sử khiếu nại");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customer/orders">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Trung tâm Khiếu nại
            </h1>
            <p className="text-muted-foreground">
              Quản lý và theo dõi các yêu cầu hỗ trợ, khiếu nại đơn hàng
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchComplaints}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button size="sm" asChild>
            <Link href="/customer/orders">
              <MessageSquare className="mr-2 h-4 w-4" />
              Tạo khiếu nại mới
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2">
          <TabsTrigger value="history">Lịch sử khiếu nại</TabsTrigger>
          <TabsTrigger value="guides" disabled>Hướng dẫn xử lý</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card className="border-none shadow-sm bg-muted/30">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Trạng thái:</span>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px] bg-background">
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      <SelectItem value="PENDING_SELLER">Chờ Seller phản hồi</SelectItem>
                      <SelectItem value="SELLER_APPROVED">Seller đã chấp thuận</SelectItem>
                      <SelectItem value="SELLER_REJECTED">Seller đã từ chối</SelectItem>
                      <SelectItem value="AUTO_ESCALATED">Tự động chuyển Moderator</SelectItem>
                      <SelectItem value="MODERATOR_REVIEW">Moderator đang xem xét</SelectItem>
                      <SelectItem value="RESOLVED_REFUNDED">Đã hoàn tiền</SelectItem>
                      <SelectItem value="CLOSED_REJECTED">Đã đóng (từ chối)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <div className="grid gap-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3 flex-1">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : complaints.length === 0 ? (
              <Card className="border-dashed border-2 bg-muted/10">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">Chưa có khiếu nại nào</h3>
                  <p className="text-muted-foreground max-w-sm mt-2">
                    Lịch sử khiếu nại của bạn sẽ xuất hiện tại đây sau khi bạn gửi yêu cầu hỗ trợ cho đơn hàng.
                  </p>
                  <Button variant="outline" className="mt-6" asChild>
                    <Link href="/customer/orders">Đến danh sách đơn hàng</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              complaints.map((item) => {
                const status = statusConfig[item.status] || { label: item.status, variant: "outline", color: "" };
                return (
                  <Card key={item._id} className="group hover:border-primary/50 transition-all duration-200 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        {/* Status sidebar indicator */}
                        <div className={`w-1 md:w-1.5 ${status.color.replace('text-', 'bg-') || 'bg-muted'}`} />
                        
                        <div className="p-6 flex-1 flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-primary">
                                {item.ticketCode}
                              </span>
                              <Badge variant={status.variant as any} className={`${status.color} border-current/20 font-medium`}>
                                {status.label}
                              </Badge>
                              <Badge variant="outline" className="text-xs bg-muted/50">
                                {categoryLabels[item.category] || item.category}
                              </Badge>
                            </div>

                            <div>
                              <h3 className="text-lg font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.content}
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Gửi ngày: {formatDate(item.createdAt)}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                <span>Giá trị đơn: {formatPrice(item.orderValue)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center">
                            <Button variant="outline" className="shadow-sm" asChild>
                              <Link href={`/customer/complaints/${item._id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Xem chi tiết
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
