"use client";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, ArrowDownCircle, ArrowUpCircle, CheckCircle, XCircle, CreditCard, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { depositSchema, type DepositInput } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { paymentService, type WalletBalanceResponse, type WalletTransactionResponse } from "@/lib/services/payment.service";

const quickAmounts = [100000, 200000, 500000, 1000000, 2000000];

function WalletPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [walletBalance, setWalletBalance] = useState<WalletBalanceResponse | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionResponse[]>([]);

  const form = useForm<DepositInput>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      paymentMethod: "vnpay",
    },
  });

  const amount = form.watch("amount");

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setRefreshing(true);
      const [balanceData, transactionsData] = await Promise.all([
        paymentService.getWalletBalance(),
        paymentService.getWalletTransactions({ limit: 50 }),
      ]);
      
      setWalletBalance(balanceData);
      setTransactions(transactionsData);
    } catch (error: any) {
      console.error("Error fetching wallet data:", error);
      toast.error(error.message || "Không thể tải dữ liệu ví");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    
    // Handle redirect from payment return
    const topupStatus = searchParams.get("topup");
    const transactionRef = searchParams.get("ref");
    
    if (topupStatus && transactionRef) {
      // Remove query params from URL
      router.replace("/customer/wallet", { scroll: false });
      
      // Show toast and refresh wallet data
      if (topupStatus === "success") {
        toast.success("Nạp tiền thành công! Số dư đã được cập nhật.");
        // Refresh wallet data to show updated balance
        setTimeout(() => {
          fetchWalletData();
        }, 500);
      } else if (topupStatus === "failed") {
        toast.error("Thanh toán thất bại. Vui lòng thử lại.");
      }
    }
  }, [searchParams, router]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleQuickAmount = (value: number) => {
    form.setValue("amount", value, { shouldValidate: true });
  };

  const handleRefresh = () => {
    fetchWalletData();
  };

  const handleDeposit = async (data: DepositInput) => {
    setIsProcessing(true);
    
    try {
      // Only VNPay is currently implemented
      if (data.paymentMethod !== "vnpay") {
        toast.error("Hiện tại chỉ hỗ trợ thanh toán qua VNPay. Các phương thức khác đang được phát triển.");
        setIsProcessing(false);
        return;
      }

      toast.info("Đang tạo yêu cầu nạp tiền...");

      // Create payment request
      const response = await paymentService.createTopUp({
        amount: data.amount,
      });

      // Redirect to VNPay
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán");
      }
    } catch (error: any) {
      setIsProcessing(false);
      toast.error(error.message || "Có lỗi xảy ra khi tạo yêu cầu nạp tiền");
    }
  };

  const getTransactionType = (type: string, direction: string) => {
    if (type === "Topup") return "deposit";
    if (type === "Purchase" || type === "Hold") return "payment";
    if (type === "Refund" || type === "Release") return "refund";
    return direction === "In" ? "deposit" : "withdrawal";
  };

  const getTransactionDescription = (txn: WalletTransactionResponse) => {
    switch (txn.type) {
      case "Topup":
        return "Nạp tiền vào ví";
      case "Purchase":
        return "Thanh toán đơn hàng";
      case "Hold":
        return "Giữ tiền đơn hàng";
      case "Release":
        return "Giải phóng tiền";
      case "Refund":
        return "Hoàn tiền";
      case "Adjustment":
        return "Điều chỉnh số dư";
      default:
        return txn.note || "Giao dịch ví";
    }
  };

  const getStatusIcon = (type: string) => {
    // Wallet transactions are always completed once created
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusLabel = () => {
    return "Hoàn thành";
  };

  const getStatusBadgeVariant = () => {
    return "default" as const;
  };

  return (
    <RequireAuth>
        <div className="container py-6 md:py-8 max-w-6xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Ví điện tử</h1>
            <p className="text-muted-foreground">
              Quản lý số dư và giao dịch của bạn
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
        </div>

        {/* Balance Card */}
        {loading ? (
          <div className="grid md:grid-cols-1 gap-4 max-w-md">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid md:grid-cols-1 gap-4 max-w-md">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số dư hiện tại</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {walletBalance ? formatPrice(walletBalance.balance) : formatPrice(0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Sẵn sàng sử dụng ngay
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="deposit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="deposit">
              <ArrowDownCircle className="h-4 w-4 mr-2" />
              Nạp tiền
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <ArrowUpCircle className="h-4 w-4 mr-2" />
              Lịch sử giao dịch
            </TabsTrigger>
          </TabsList>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Nạp tiền vào ví</CardTitle>
                <CardDescription>
                  Nạp tiền để thanh toán đơn hàng nhanh chóng và an toàn
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleDeposit)} className="space-y-6">
                    {/* Amount Input */}
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số tiền nạp (VND)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Nhập số tiền"
                              {...field}
                              onChange={(e) => {
                                const value = e.target.value ? parseInt(e.target.value) : undefined;
                                field.onChange(value);
                              }}
                              min="50000"
                              step="10000"
                              className="text-lg"
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Số tiền tối thiểu: 50,000 VND, tối đa: 50,000,000 VND
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Quick Amount Buttons */}
                    <div className="space-y-2">
                      <Label>Chọn nhanh:</Label>
                      <div className="flex flex-wrap gap-2">
                        {quickAmounts.map((value) => (
                          <Button
                            key={value}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickAmount(value)}
                          >
                            {formatPrice(value)}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Method */}
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phương thức thanh toán</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="vnpay">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  VNPay
                                </div>
                              </SelectItem>
                              <SelectItem value="bank">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4" />
                                  Chuyển khoản ngân hàng
                                </div>
                              </SelectItem>
                              <SelectItem value="momo">Ví MoMo</SelectItem>
                              <SelectItem value="zalopay">Ví ZaloPay</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Summary */}
                    {amount && amount >= 50000 && (
                      <Alert variant="info">
                        <AlertIcon.info className="h-4 w-4" />
                        <AlertDescription>
                          Bạn sẽ nạp:{" "}
                          <strong className="text-lg">
                            {formatPrice(amount)}
                          </strong>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="mr-2 h-4 w-4" />
                          Nạp tiền
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Alert variant="info">
              <AlertIcon.info className="h-4 w-4" />
              <AlertDescription>
                <strong>Lưu ý:</strong> Giao dịch nạp tiền có thể mất 5-15 phút để xử lý.
                Chúng tôi sẽ thông báo khi giao dịch hoàn tất.
              </AlertDescription>
            </Alert>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <Skeleton className="h-5 w-5 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-5 w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Chưa có giao dịch</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Lịch sử giao dịch sẽ hiển thị tại đây
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => {
                  const txnType = getTransactionType(txn.type, txn.direction);
                  const description = getTransactionDescription(txn);
                  
                  return (
                    <Card key={txn.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {txnType === "deposit" || txn.direction === "In" ? (
                                <ArrowDownCircle className="h-5 w-5 text-green-600" />
                              ) : txnType === "withdrawal" ? (
                                <ArrowUpCircle className="h-5 w-5 text-blue-600" />
                              ) : (
                                <CreditCard className="h-5 w-5 text-orange-600" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="font-medium">{description}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{txn.type}</span>
                                <span>•</span>
                                <span>{formatDate(txn.createdAt)}</span>
                              </div>
                              {txn.note && (
                                <p className="text-xs text-muted-foreground">{txn.note}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <p
                              className={`font-bold text-lg ${
                                txn.direction === "In"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {txn.direction === "In" ? "+" : "-"}
                              {formatPrice(txn.amount)}
                            </p>
                            <Badge variant={getStatusBadgeVariant()}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(txn.type)}
                                {getStatusLabel()}
                              </div>
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </RequireAuth>
  );
}

export default function WalletPage() {
  return (
    <Suspense fallback={<div className="p-6">Đang tải ví...</div>}>
      <WalletPageContent />
    </Suspense>
  );
}
