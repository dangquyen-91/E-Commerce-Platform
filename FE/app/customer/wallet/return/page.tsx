"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { paymentService } from "@/lib/services/payment.service";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/RequireAuth";
import Link from "next/link";

function WalletReturnPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState<{
    status: string;
    amount?: number;
    transactionRef?: string;
    failureReason?: string;
  } | null>(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // 2 possible return flows:
        // 1) Backend redirect: /customer/wallet/return?status=success&ref=TOPUP-...
        // 2) VNPay returns directly to FE: /customer/wallet/return?vnp_TxnRef=TOPUP-...&vnp_ResponseCode=...
        const status = searchParams.get("status");
        const ref = searchParams.get("ref") || searchParams.get("vnp_TxnRef");

        if (!ref) {
          setPaymentStatus({
            status: "error",
          });
          setLoading(false);
          return;
        }

        // Get payment status from backend
        const payment = await paymentService.getPaymentStatus(ref);

        setPaymentStatus({
          status: payment.status.toLowerCase(),
          amount: payment.amount,
          transactionRef: payment.transactionRef,
          failureReason: payment.failureReason,
        });

        // Show toast based on status
        if (payment.status === "Success") {
          toast.success(`Nạp tiền thành công ${payment.amount.toLocaleString("vi-VN")} VND`);
          // Redirect to wallet page after 2 seconds to see updated balance
          setTimeout(() => {
            router.push("/customer/wallet");
          }, 2000);
        } else if (payment.status === "Failed") {
          toast.error(payment.failureReason || "Thanh toán thất bại");
        }
      } catch (error: any) {
        console.error("Payment status check error:", error);
        setPaymentStatus({
          status: "error",
        });
        toast.error("Không thể kiểm tra trạng thái thanh toán");
      } finally {
        setLoading(false);
      }
    };

    checkPaymentStatus();
  }, [searchParams]);

  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />;
    }

    switch (paymentStatus?.status) {
      case "success":
        return <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-12 w-12 text-red-600 mx-auto" />;
      case "pending":
      case "processing":
        return <Clock className="h-12 w-12 text-orange-600 mx-auto" />;
      default:
        return <XCircle className="h-12 w-12 text-gray-600 mx-auto" />;
    }
  };

  const getStatusTitle = () => {
    if (loading) {
      return "Đang kiểm tra trạng thái thanh toán...";
    }

    switch (paymentStatus?.status) {
      case "success":
        return "Nạp tiền thành công!";
      case "failed":
        return "Thanh toán thất bại";
      case "cancelled":
        return "Đã hủy thanh toán";
      case "pending":
      case "processing":
        return "Đang xử lý";
      default:
        return "Có lỗi xảy ra";
    }
  };

  const getStatusDescription = () => {
    if (loading) {
      return "Vui lòng đợi trong giây lát...";
    }

    switch (paymentStatus?.status) {
      case "success":
        return paymentStatus.amount
          ? `Bạn đã nạp thành công ${paymentStatus.amount.toLocaleString("vi-VN")} VND vào ví. Số dư đã được cập nhật.`
          : "Số dư đã được cập nhật.";
      case "failed":
        return paymentStatus.failureReason || "Giao dịch không thể hoàn tất. Vui lòng thử lại.";
      case "cancelled":
        return "Bạn đã hủy giao dịch thanh toán.";
      case "pending":
      case "processing":
        return "Giao dịch đang được xử lý. Vui lòng đợi trong giây lát.";
      default:
        return "Không thể xác định trạng thái thanh toán.";
    }
  };

  return (
    <RequireAuth>
      <div className="container py-6 md:py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <div className="mb-4">{getStatusIcon()}</div>
            <CardTitle className="text-2xl">{getStatusTitle()}</CardTitle>
            <CardDescription className="text-base mt-2">
              {getStatusDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentStatus?.transactionRef && (
              <div className="text-center text-sm text-muted-foreground">
                Mã giao dịch: <span className="font-mono">{paymentStatus.transactionRef}</span>
              </div>
            )}

            {paymentStatus?.status === "failed" && paymentStatus.failureReason && (
              <Alert variant="destructive">
                <AlertIcon.error className="h-4 w-4" />
                <AlertDescription>{paymentStatus.failureReason}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/customer/wallet")}
              >
                Về trang ví
              </Button>
              {paymentStatus?.status === "success" && (
                <Button className="flex-1" asChild>
                  <Link href="/customer/orders">Xem đơn hàng</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}

export default function WalletReturnPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang kiểm tra trạng thái thanh toán...</div>}>
      <WalletReturnPageContent />
    </Suspense>
  );
}
