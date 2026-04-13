"use client";

import { useEffect, useState } from "react";
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
import { AlertTriangle, ArrowLeft, Eye, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { complaintService } from "@/lib/services/complaint.service";
import type { Complaint } from "@/lib/services/complaint.service";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_SELLER: { label: "Chờ Seller phản hồi", variant: "outline" },
  SELLER_APPROVED: { label: "Seller đã chấp thuận", variant: "default" },
  SELLER_REJECTED: { label: "Seller đã từ chối", variant: "destructive" },
  AUTO_ESCALATED: { label: "Tự động chuyển Moderator", variant: "outline" },
  MODERATOR_REVIEW: { label: "Moderator đang xem xét", variant: "default" },
  RESOLVED_REFUNDED: { label: "Đã hoàn tiền", variant: "secondary" },
  CLOSED_REJECTED: { label: "Đã đóng (từ chối)", variant: "secondary" },
};

export default function SellerComplaintsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const result = await complaintService.getSellerComplaints({
        status: statusFilter !== "all" ? statusFilter : undefined,
        limit: 50,
      });
      setComplaints(result.tickets);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách khiếu nại của shop");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [statusFilter]);

  const formatDate = (date: Date | string) => new Date(date).toLocaleString("vi-VN");

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Khiếu nại shop</h1>
            <p className="text-sm text-muted-foreground">Theo dõi các khiếu nại liên quan đơn hàng của shop bạn</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Lọc trạng thái" />
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

          <Button variant="outline" onClick={fetchComplaints}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-muted/30">
        <CardHeader>
          <CardTitle>Tổng quan</CardTitle>
          <CardDescription>
            Tổng số khiếu nại: <span className="font-semibold">{complaints.length}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-5 w-56" />
                <Skeleton className="h-4 w-full mt-3" />
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
              <p className="text-muted-foreground mt-2">Khi khách hàng khiếu nại, danh sách sẽ hiển thị tại đây.</p>
            </CardContent>
          </Card>
        ) : (
          complaints.map((item) => {
            const status = statusConfig[item.status] || { label: item.status, variant: "outline" as const };
            return (
              <Card key={item._id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-primary">{item.ticketCode}</span>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.content}</p>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Tạo lúc: {formatDate(item.createdAt)}
                    </div>
                  </div>

                  <Button variant="outline" asChild>
                    <Link href={`/seller/complaints/${item._id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

