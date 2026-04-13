"use client";

import { useState, useEffect, use } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  MessageSquare,
  FileText,
  Loader2,
  Gavel,
  Image as ImageIcon,
  Plus,
  Send,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { complaintService } from "@/lib/services/complaint.service";
import { useAuthStore } from "@/lib/auth";
import type { Complaint, ComplaintTimeline, EvidenceType } from "@/lib/services/complaint.service";

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
  ProductQuality: "Chất lượng sản phẩm",
  NotAsDescribed: "Không đúng mô tả",
  MissingWrongItems: "Thiếu/Sai hàng",
  DeliveryIssues: "Vấn đề giao hàng",
  AccountNotWorking: "Tài khoản không hoạt động",
  SellerNotResponding: "Người bán không phản hồi",
  RefundDispute: "Tranh chấp hoàn tiền",
};

const resolutionLabels: Record<string, string> = {
  None: "Chưa có",
  FullRefund: "Hoàn tiền 100%",
  PartialRefund: "Hoàn tiền một phần",
  Replace: "Đổi sản phẩm",
  Reject: "Từ chối",
};

export default function CustomerComplaintDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const router = useRouter();
  const { id: complaintId } = use(params);
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintTimeline[]>([]);

  // Evidence state
  const [isEvidenceDialogOpen, setIsEvidenceDialogOpen] = useState(false);
  const [isSubmittingEvidence, setIsSubmittingEvidence] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("Screenshot");
  const [evidenceDesc, setEvidenceDesc] = useState("");

  // Appeal state
  const [isAppealDialogOpen, setIsAppealDialogOpen] = useState(false);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const [appealReason, setAppealReason] = useState("");

  const fetchComplaint = async () => {
    setIsLoading(true);
    try {
      const [complaintResult, timelineResult] = await Promise.all([
        complaintService.getComplaintById(complaintId),
        complaintService.getComplaintTimeline(complaintId),
      ]);

      setComplaint(complaintResult);
      setTimeline(timelineResult);
    } catch (error) {
      console.error("Failed to fetch complaint:", error);
      toast.error("Không thể tải thông tin khiếu nại");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const handleAddEvidence = async () => {
    if (!evidenceUrl.trim()) {
      toast.error("Vui lòng nhập URL bằng chứng");
      return;
    }

    setIsSubmittingEvidence(true);
    try {
      await complaintService.addEvidence(complaintId, {
        evidence: [{
          type: evidenceType,
          url: evidenceUrl,
          description: evidenceDesc
        }]
      });
      toast.success("Đã thêm bằng chứng thành công");
      setIsEvidenceDialogOpen(false);
      setEvidenceUrl("");
      setEvidenceDesc("");
      fetchComplaint();
    } catch (error) {
      toast.error("Không thể thêm bằng chứng");
    } finally {
      setIsSubmittingEvidence(false);
    }
  };

  const handleFileAppeal = async () => {
    if (!appealReason.trim()) {
      toast.error("Vui lòng nhập lý do kháng cáo");
      return;
    }

    setIsSubmittingAppeal(true);
    try {
      await complaintService.fileAppeal(complaintId, {
        reason: appealReason
      });
      toast.success("Đã nộp kháng cáo thành công");
      setIsAppealDialogOpen(false);
      setAppealReason("");
      fetchComplaint();
    } catch (error) {
      toast.error("Không thể nộp kháng cáo");
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("vi-VN");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">Không tìm thấy khiếu nại</h2>
        <Button className="mt-6" asChild>
          <Link href="/customer/complaints">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[complaint.status] || { label: complaint.status, variant: "outline" as const, color: "" };
  const isOwner = typeof complaint.customerUserId === 'object' ? complaint.customerUserId._id === user?.id : complaint.customerUserId === user?.id;
  const canAddEvidence = isOwner && ["PENDING_SELLER", "SELLER_APPROVED", "AUTO_ESCALATED", "MODERATOR_REVIEW"].includes(complaint.status);
  const canAppeal = isOwner && complaint.status === "CLOSED_REJECTED";

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customer/complaints">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">{complaint.ticketCode}</h1>
              <Badge variant={status.variant} className={status.color}>
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Gửi ngày: {formatDate(complaint.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {canAddEvidence && (
            <Dialog open={isEvidenceDialogOpen} onOpenChange={setIsEvidenceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm bằng chứng
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bổ sung bằng chứng</DialogTitle>
                  <DialogDescription>Cung cấp thêm hình ảnh hoặc tài liệu để hỗ trợ giải quyết khiếu nại.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">URL Hình ảnh/Tài liệu</label>
                    <Input 
                      value={evidenceUrl} 
                      onChange={(e) => setEvidenceUrl(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Loại bằng chứng</label>
                    <Select value={evidenceType} onValueChange={(v: any) => setEvidenceType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Screenshot">Ảnh màn hình</SelectItem>
                        <SelectItem value="Image">Hình ảnh</SelectItem>
                        <SelectItem value="Video">Video</SelectItem>
                        <SelectItem value="Document">Tài liệu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mô tả ngắn</label>
                    <Textarea 
                      value={evidenceDesc} 
                      onChange={(e) => setEvidenceDesc(e.target.value)}
                      placeholder="Mô tả nội dung bằng chứng này..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEvidenceDialogOpen(false)}>Hủy</Button>
                  <Button onClick={handleAddEvidence} disabled={isSubmittingEvidence}>
                    {isSubmittingEvidence ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canAppeal && (
            <Dialog open={isAppealDialogOpen} onOpenChange={setIsAppealDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Send className="mr-2 h-4 w-4" />
                  Kháng cáo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nộp đơn kháng cáo</DialogTitle>
                  <DialogDescription>Bạn có 72 giờ để kháng cáo nếu không đồng ý với quyết định của Moderator.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Lý do kháng cáo *</label>
                    <Textarea 
                      value={appealReason} 
                      onChange={(e) => setAppealReason(e.target.value)}
                      placeholder="Trình bày lý do bạn không đồng ý với quyết định..."
                      rows={5}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAppealDialogOpen(false)}>Hủy</Button>
                  <Button onClick={handleFileAppeal} disabled={isSubmittingAppeal}>
                    {isSubmittingAppeal ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi kháng cáo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Detail Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Chi tiết khiếu nại
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">{complaint.title}</h2>
                <Badge variant="outline" className="mt-2">
                  {categoryLabels[complaint.category] || complaint.category}
                </Badge>
              </div>

              <div>
                <h4 className="font-medium text-sm text-muted-foreground uppercase mb-2">Nội dung yêu cầu</h4>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{complaint.content}</p>
              </div>

              {/* Buyer evidence list */}
              {complaint.buyerEvidence && complaint.buyerEvidence.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Bằng chứng từ người mua ({complaint.buyerEvidence.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.buyerEvidence.map((ev, idx) => (
                      <a 
                        key={idx} 
                        href={ev.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative aspect-video border rounded-lg overflow-hidden bg-muted hover:border-primary transition-all"
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem ảnh
                        </div>
                        <div className="p-2 text-[10px] text-muted-foreground bg-muted truncate mt-auto">
                          {ev.type}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller evidence list */}
              {complaint.sellerEvidence && complaint.sellerEvidence.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Bằng chứng từ seller ({complaint.sellerEvidence.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {complaint.sellerEvidence.map((ev, idx) => (
                      <a 
                        key={idx} 
                        href={ev.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative aspect-video border rounded-lg overflow-hidden bg-muted hover:border-primary transition-all"
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity">
                          Xem ảnh
                        </div>
                        <div className="p-2 text-[10px] text-muted-foreground bg-muted truncate mt-auto">
                          {ev.type}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {complaint.sellerResponseNote && (
                <div className="bg-muted/30 border rounded-xl p-5 space-y-2">
                  <div className="flex items-center gap-2 text-blue-600 font-bold">
                    <MessageSquare className="h-5 w-5" />
                    PHẢN HỒI TỪ SELLER
                  </div>
                  <p className="text-sm">{complaint.sellerResponseNote}</p>
                </div>
              )}

              {/* Decision Section */}
              {complaint.decidedAt && (
                <div className="bg-muted/30 border rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 text-green-600 font-bold">
                    <Gavel className="h-5 w-5" />
                    QUYẾT ĐỊNH TỪ HỆ THỐNG
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">Kết quả:</span>
                      <p className="font-bold text-lg">
                        {resolutionLabels[complaint.resolutionType] || complaint.resolutionType}
                      </p>
                    </div>
                    {complaint.refundAmount && (
                      <div className="space-y-1">
                        <span className="text-muted-foreground">Số tiền hoàn:</span>
                        <p className="font-bold text-lg text-primary">{formatPrice(complaint.refundAmount)}</p>
                      </div>
                    )}
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs uppercase font-medium">Lý do giải quyết:</span>
                    <p className="mt-1 text-sm">{complaint.decisionNote}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thông tin chung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Trạng thái:</span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Giá trị đơn:</span>
                <span className="font-medium">{formatPrice(complaint.orderValue)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Shop:</span>
                <span className="font-medium truncate max-w-[150px]">
                  {typeof complaint.shopId === 'object' ? (complaint.shopId.shopName || complaint.shopId.name || 'N/A') : 'N/A'}
                </span>
              </div>
              {complaint.appealDeadline && (
                <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                  <p className="text-purple-700 text-xs font-bold uppercase mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Hạn chót kháng cáo
                  </p>
                  <p className="text-purple-900 font-medium">{formatDate(complaint.appealDeadline)}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Lịch sử hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-6 py-4 space-y-6">
                {timeline.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-4">Chưa có hoạt động</p>
                ) : (
                  timeline.map((event, idx) => (
                    <div key={event._id} className="relative flex gap-4">
                      {idx !== timeline.length - 1 && (
                        <div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%+12px)] bg-muted" />
                      )}
                      <div className="mt-1.5 h-6 w-6 rounded-full border-2 border-primary bg-background z-10 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{event.description}</p>
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] uppercase font-bold text-muted-foreground">{event.actorRole}</span>
                           <span className="text-[10px] text-muted-foreground">•</span>
                           <span className="text-[10px] text-muted-foreground">{formatDate(event.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
