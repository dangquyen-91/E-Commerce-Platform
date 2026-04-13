"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ArrowLeft, Clock, FileText, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { complaintService } from "@/lib/services/complaint.service";
import type { Complaint, ComplaintTimeline } from "@/lib/services/complaint.service";
import { EvidenceUpload, type EvidenceItem } from "@/components/complaint/EvidenceUpload";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_SELLER: { label: "Chờ Seller phản hồi", variant: "outline" },
  SELLER_APPROVED: { label: "Seller đã chấp thuận", variant: "default" },
  SELLER_REJECTED: { label: "Seller đã từ chối", variant: "destructive" },
  AUTO_ESCALATED: { label: "Tự động chuyển Moderator", variant: "outline" },
  MODERATOR_REVIEW: { label: "Moderator đang xem xét", variant: "default" },
  RESOLVED_REFUNDED: { label: "Đã hoàn tiền", variant: "secondary" },
  CLOSED_REJECTED: { label: "Đã đóng (từ chối)", variant: "secondary" },
};

const resolutionLabels: Record<string, string> = {
  None: "Chưa có",
  FullRefund: "Hoàn tiền 100%",
  PartialRefund: "Hoàn tiền một phần",
  Replace: "Đổi sản phẩm",
  Reject: "Từ chối",
};

export default function SellerComplaintDetailPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = use(params);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintTimeline[]>([]);

  const [decisionNote, setDecisionNote] = useState("");
  const [sellerEvidence, setSellerEvidence] = useState<EvidenceItem[]>([]);

  const fetchComplaintDetail = async () => {
    setLoading(true);
    try {
      const [detail, tl] = await Promise.all([
        complaintService.getComplaintById(id),
        complaintService.getComplaintTimeline(id),
      ]);
      setComplaint(detail);
      setTimeline(tl);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết khiếu nại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchComplaintDetail();
  }, [id]);

  const handleSellerDecision = async (decision: "APPROVE" | "REJECT") => {
    if (decision === "REJECT") {
      if (!decisionNote.trim()) {
        toast.error("Khi từ chối khiếu nại, bạn phải nhập lý do");
        return;
      }
      if (sellerEvidence.length === 0) {
        toast.error("Khi từ chối khiếu nại, bạn phải tải lên ít nhất 1 bằng chứng");
        return;
      }
    }

    try {
      setActionLoading(decision);
      await complaintService.sellerDecision(id, {
        decision,
        note:
          decision === "APPROVE"
            ? decisionNote.trim() || "Seller đã xem evidence và chấp thuận, chuyển Moderator quyết định"
            : decisionNote.trim(),
        evidence: decision === "REJECT" ? sellerEvidence : undefined,
      });
      toast.success(decision === "APPROVE" ? "Đã approve khiếu nại" : "Đã reject khiếu nại");
      setDecisionNote("");
      setSellerEvidence([]);
      await fetchComplaintDetail();
    } catch (error) {
      console.error(error);
      toast.error("Không thể gửi phản hồi khiếu nại");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold">Không tìm thấy khiếu nại</h2>
        <Button className="mt-4" asChild>
          <Link href="/seller/complaints">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  const status = statusConfig[complaint.status] || { label: complaint.status, variant: "outline" as const };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/seller/complaints">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{complaint.ticketCode}</h1>
          <p className="text-sm text-muted-foreground">Chi tiết khiếu nại của shop</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {complaint.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {complaint.status === "PENDING_SELLER" ? (
              <div className="space-y-4 border rounded-lg p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ghi chú phản hồi</label>
                  <Textarea
                    placeholder="Nhập ghi chú phản hồi của seller..."
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Bằng chứng từ seller (bắt buộc khi Reject)</p>
                  <EvidenceUpload
                    evidence={sellerEvidence}
                    onChange={setSellerEvidence}
                    maxItems={10}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => handleSellerDecision("APPROVE")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "APPROVE" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleSellerDecision("REJECT")}
                    disabled={actionLoading !== null}
                  >
                    {actionLoading === "REJECT" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}

            <p className="text-sm leading-relaxed">{complaint.content}</p>

            {complaint.buyerEvidence?.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Bằng chứng từ khách hàng</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {complaint.buyerEvidence.map((ev, idx) => (
                    <a key={idx} href={ev.url} target="_blank" rel="noreferrer" className="text-xs p-2 border rounded hover:border-primary">
                      {ev.type}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {complaint.sellerEvidence && complaint.sellerEvidence.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Bằng chứng từ seller</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {complaint.sellerEvidence.map((ev, idx) => (
                    <a key={idx} href={ev.url} target="_blank" rel="noreferrer" className="text-xs p-2 border rounded hover:border-primary">
                      {ev.type}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {complaint.sellerResponseNote ? (
              <Card className="bg-muted/40">
                <CardContent className="pt-4 space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Phản hồi seller:</span> {complaint.sellerResponseNote}</div>
                </CardContent>
              </Card>
            ) : null}

            {complaint.decidedAt ? (
              <Card className="bg-muted/40">
                <CardContent className="pt-4 space-y-1 text-sm">
                  <div><span className="text-muted-foreground">Kết quả:</span> {resolutionLabels[complaint.resolutionType] || complaint.resolutionType}</div>
                  {complaint.refundAmount ? <div><span className="text-muted-foreground">Hoàn tiền:</span> {complaint.refundAmount.toLocaleString("vi-VN")}đ</div> : null}
                  <div><span className="text-muted-foreground">Ghi chú quyết định moderator:</span> {complaint.decisionNote || "-"}</div>
                </CardContent>
              </Card>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có hoạt động</p>
            ) : (
              timeline.map((item) => (
                <div key={item._id} className="text-sm border-l-2 pl-3">
                  <p>{item.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" /> {new Date(item.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
