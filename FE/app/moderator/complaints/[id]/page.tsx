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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  User,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  FileText,
  Loader2,
  Gavel,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { complaintService } from "@/lib/services/complaint.service";
import type { Complaint, ComplaintTimeline, ComplaintResolution } from "@/lib/services/complaint.service";

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

export default function ModeratorComplaintDetailPage({
  params,
}: Readonly<{
  params: Promise<{ id: string }>;
}>) {
  const router = useRouter();
  const { id: complaintId } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintTimeline[]>([]);

  // Decision dialog state
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [decisionResolution, setDecisionResolution] = useState<ComplaintResolution>("Reject");
  const [decisionReason, setDecisionReason] = useState("");
  const [refundAmount, setRefundAmount] = useState<number>(0);


  // Request info state
  const [isRequestInfoDialogOpen, setIsRequestInfoDialogOpen] = useState(false);
  const [requestInfoQuestions, setRequestInfoQuestions] = useState("");
  const [isRequestingInfo, setIsRequestingInfo] = useState(false);

  // Fetch complaint data
  const fetchComplaint = async () => {
    setIsLoading(true);
    try {
      const [complaintResult, timelineResult] = await Promise.all([
        complaintService.getComplaintById(complaintId),
        complaintService.getComplaintTimeline(complaintId),
      ]);

      setComplaint(complaintResult);
      setTimeline(timelineResult);

      // Set default refund amount
      if (complaintResult.orderValue) {
        setRefundAmount(complaintResult.orderValue);
      }
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

  // Assign to self
  const handleAssignToSelf = async () => {
    try {
      await complaintService.assignToModerator(complaintId);
      toast.success("Đã nhận xử lý khiếu nại");
      fetchComplaint();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể nhận khiếu nại";
      toast.error(message);
    }
  };

  // Request more info
  const handleRequestInfo = async () => {
    if (!requestInfoQuestions.trim()) return;

    setIsRequestingInfo(true);
    try {
      await complaintService.requestMoreInfo(complaintId, {
        targetParty: "buyer",
        questions: requestInfoQuestions.split("\n").filter((q) => q.trim()),
      });
      toast.success("Đã yêu cầu thêm thông tin");
      setRequestInfoQuestions("");
      setIsRequestInfoDialogOpen(false);
      fetchComplaint();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể yêu cầu thông tin";
      toast.error(message);
    } finally {
      setIsRequestingInfo(false);
    }
  };

  // Make decision
  const handleMakeDecision = async () => {
    if (!decisionReason.trim()) {
      toast.error("Vui lòng nhập lý do quyết định");
      return;
    }

    setIsSubmittingDecision(true);
    try {
      await complaintService.makeDecision(complaintId, {
        resolution: decisionResolution,
        reason: decisionReason,
        refundAmount: ["FullRefund", "PartialRefund"].includes(decisionResolution) ? refundAmount : undefined,
      });
      toast.success("Đã đưa ra quyết định");
      setIsDecisionDialogOpen(false);
      fetchComplaint();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể đưa ra quyết định";
      toast.error(message);
    } finally {
      setIsSubmittingDecision(false);
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy khiếu nại</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Khiếu nại này không tồn tại hoặc bạn không có quyền xem.
            </p>
            <Button onClick={() => router.push("/moderator/complaints")} variant="default">
              Quay lại hàng đợi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = statusConfig[complaint.status] || { label: complaint.status, variant: "outline" as const, color: "text-gray-600" };
  const canMakeDecision = ["MODERATOR_REVIEW", "AUTO_ESCALATED", "SELLER_APPROVED", "SELLER_REJECTED"].includes(complaint.status);
  const canAssign = !complaint.assignedToUserId;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/moderator/complaints">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {complaint.ticketCode}
              </h1>
              <Badge variant={status.variant} className={status.color}>
                {status.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Tạo lúc: {formatDate(complaint.createdAt)}
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canAssign && (
            <Button onClick={handleAssignToSelf}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Nhận xử lý
            </Button>
          )}

          {canMakeDecision && (
            <>
              <Dialog open={isRequestInfoDialogOpen} onOpenChange={setIsRequestInfoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Yêu cầu thông tin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yêu cầu thêm thông tin</DialogTitle>
                    <DialogDescription>
                      Nhập các câu hỏi cần người mua trả lời (mỗi câu một dòng)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Textarea
                      value={requestInfoQuestions}
                      onChange={(e) => setRequestInfoQuestions(e.target.value)}
                      placeholder="Vui lòng cung cấp screenshot lỗi...
Bạn đã thử đăng nhập bao nhiêu lần?
..."
                      rows={5}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRequestInfoDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleRequestInfo} disabled={isRequestingInfo}>
                      {isRequestingInfo ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang gửi...
                        </>
                      ) : (
                        "Gửi yêu cầu"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Gavel className="mr-2 h-4 w-4" />
                    Đưa quyết định
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Đưa ra quyết định</DialogTitle>
                    <DialogDescription>
                      Chọn hình thức xử lý và nhập lý do
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Hình thức xử lý</Label>
                      <Select
                        value={decisionResolution}
                        onValueChange={(v) => setDecisionResolution(v as ComplaintResolution)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FullRefund">Hoàn tiền 100%</SelectItem>
                          <SelectItem value="PartialRefund">Hoàn tiền một phần</SelectItem>
                          <SelectItem value="Replace">Đổi sản phẩm</SelectItem>
                          <SelectItem value="Reject">Từ chối khiếu nại</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {["FullRefund", "PartialRefund"].includes(decisionResolution) && (
                      <div className="space-y-2">
                        <Label>Số tiền hoàn (VND)</Label>
                        <Input
                          type="number"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(Number(e.target.value))}
                          max={complaint.orderValue}
                        />
                        <p className="text-xs text-muted-foreground">
                          Tối đa: {formatPrice(complaint.orderValue)}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Lý do quyết định *</Label>
                      <Textarea
                        value={decisionReason}
                        onChange={(e) => setDecisionReason(e.target.value)}
                        placeholder="Nhập lý do cho quyết định..."
                        rows={4}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDecisionDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button onClick={handleMakeDecision} disabled={isSubmittingDecision}>
                      {isSubmittingDecision ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Xác nhận quyết định"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Complaint Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Thông tin khiếu nại
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{complaint.title}</h3>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge variant="outline">
                    {categoryLabels[complaint.category] || complaint.category}
                  </Badge>
                  {complaint.subcategory && (
                    <Badge variant="secondary">{complaint.subcategory}</Badge>
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Nội dung</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {complaint.content}
                </p>
              </div>

              {/* Buyer Evidence */}
              {complaint.buyerEvidence && complaint.buyerEvidence.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Bằng chứng từ người mua ({complaint.buyerEvidence.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {complaint.buyerEvidence.map((evidence, idx) => (
                        <a
                          key={idx}
                          href={evidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border rounded-lg p-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-xs font-medium">{evidence.type}</div>
                          {evidence.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {evidence.description}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Seller Evidence */}
              {complaint.sellerEvidence && complaint.sellerEvidence.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Bằng chứng từ seller ({complaint.sellerEvidence.length})
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {complaint.sellerEvidence.map((evidence, idx) => (
                        <a
                          key={idx}
                          href={evidence.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border rounded-lg p-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="text-xs font-medium">{evidence.type}</div>
                          {evidence.description && (
                            <div className="text-xs text-muted-foreground truncate">
                              {evidence.description}
                            </div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {complaint.sellerResponseNote && (
                <>
                  <Separator />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Phản hồi từ seller
                    </h4>
                    <p className="text-sm">{complaint.sellerResponseNote}</p>
                  </div>
                </>
              )}

              {/* Decision Info */}
              {complaint.decidedAt && (
                <>
                  <Separator />
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      Quyết định
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hình thức:</span>
                        <Badge variant="outline">
                          {resolutionLabels[complaint.resolutionType] || complaint.resolutionType}
                        </Badge>
                      </div>
                      {complaint.refundAmount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Số tiền hoàn:</span>
                          <span className="font-medium">{formatPrice(complaint.refundAmount)}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Lý do:</span>
                        <p className="mt-1">{complaint.decisionNote}</p>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Quyết định lúc:</span>
                        <span>{formatDate(complaint.decidedAt)}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Parties Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Các bên liên quan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Người mua</h4>
                <p className="font-medium">
                  {typeof complaint.customerUserId === "object"
                    ? complaint.customerUserId.fullName
                    : "N/A"}
                </p>
                {typeof complaint.customerUserId === "object" && (
                  <p className="text-sm text-muted-foreground">
                    {complaint.customerUserId.email}
                  </p>
                )}
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">Shop</h4>
                <p className="font-medium">
                  {typeof complaint.shopId === "object"
                    ? (complaint.shopId.shopName || complaint.shopId.name || "N/A")
                    : "N/A"}
                </p>
              </div>

              {complaint.assignedToUserId && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Người xử lý</h4>
                    <p className="font-medium">
                      {typeof complaint.assignedToUserId === "object"
                        ? complaint.assignedToUserId.fullName
                        : "N/A"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Thông tin trạng thái
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cấp độ:</span>
                <span>{complaint.escalationLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Giá trị đơn:</span>
                <span className="font-medium">{formatPrice(complaint.orderValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vi phạm SLA:</span>
                <span>{complaint.slaBreached ? "Có" : "Không"}</span>
              </div>
              {complaint.appealDeadline && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hạn kháng cáo:</span>
                  <span>{formatDate(complaint.appealDeadline)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Lịch sử hoạt động
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có hoạt động nào
                </p>
              ) : (
                <div className="space-y-4">
                  {timeline.slice(0, 10).map((event, idx) => (
                    <div key={event._id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        {idx < timeline.length - 1 && (
                          <div className="w-0.5 h-full bg-border" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-sm font-medium">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {event.actorRole}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(event.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
