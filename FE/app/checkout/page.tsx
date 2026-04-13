"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Wallet, Shield, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { paymentService } from "@/lib/services/payment.service";
import { orderService } from "@/lib/services/order.service";
import { productService } from "@/lib/services/product.service";

interface CheckoutItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
}

interface CheckoutData {
  items: CheckoutItem[];
  subtotal: number;
  serviceFee: number;
  total: number;
  walletBalance: number;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState<CheckoutData>({
    items: [],
    subtotal: 0,
    serviceFee: 0,
    total: 0,
    walletBalance: 0,
  });

  useEffect(() => {
    const fetchCheckoutData = async () => {
      setIsLoading(true);
      try {
        // Fetch wallet balance của người dùng
        const walletBalance = await paymentService.getWalletBalance();

        // Lấy thông tin mua ngay từ query (?product=&quantity=)
        const productId = searchParams.get("product");
        const quantityParam = searchParams.get("quantity");
        const quantity = quantityParam ? Math.max(1, Number(quantityParam)) : 1;

        if (!productId) {
          // Nếu không có dữ liệu sản phẩm, điều hướng về giỏ hàng
          toast.error("Không có thông tin đơn hàng. Vui lòng chọn sản phẩm lại.");
          router.push("/products");
          return;
        }

        // Fetch dữ liệu sản phẩm thật từ BE
        const productRes = await productService.getProductById(productId);

        if (!productRes.success || !productRes.data) {
          throw new Error("Không thể tải thông tin sản phẩm");
        }

        const product = productRes.data;

        const item: CheckoutItem = {
          id: product._id || product.id || productId,
          title: product.title,
          quantity,
          price: product.price,
        };

        const items = [item];
        const subtotal = items.reduce(
          (sum, it) => sum + it.price * it.quantity,
          0
        );

        // Không tính thuế/phí cho người mua -> phí dịch vụ = 0, tổng = tạm tính
        const serviceFee = 0;
        const total = subtotal;

        setCheckoutData({
          items,
          subtotal,
          serviceFee,
          total,
          walletBalance: walletBalance.balance,
        });
      } catch (error: any) {
        console.error("Failed to fetch checkout data:", error);
        toast.error(error.message || "Không thể tải dữ liệu thanh toán");
        // Redirect nếu lỗi
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckoutData();
  }, [router, searchParams]);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "wallet",
    },
  });

  const paymentMethod = form.watch("paymentMethod");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleSubmit = async (data: CheckoutInput) => {
    if (data.paymentMethod === "wallet" && checkoutData.total > checkoutData.walletBalance) {
      toast.error("Số dư ví không đủ. Vui lòng nạp thêm tiền.");
      router.push("/customer/wallet");
      return;
    }

    if (checkoutData.items.length === 0) {
      toast.error("Giỏ hàng trống. Vui lòng thêm sản phẩm.");
      router.push("/products");
      return;
    }

    setIsProcessing(true);

    try {
      // Map payment method from form to API format
      const paymentMethod = data.paymentMethod === "wallet" ? "Wallet" : "Vnpay";

      // Create order via API
      const result = await orderService.createOrder({
        items: checkoutData.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        paymentMethod,
      });

      toast.success("Đặt hàng thành công!");

      // Redirect to order detail page
      const orderCode = (result as any).order?.orderCode || (result as any).orderCode;
      router.push(`/customer/orders/${orderCode}`);
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setIsProcessing(false);
    }
  };

  const insufficientBalance =
    paymentMethod === "wallet" &&
    checkoutData.total > checkoutData.walletBalance;

  return (
    <RequireAuth>
      <div className="container py-6 md:py-8 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Thanh toán</h1>
          <p className="text-muted-foreground">
            Kiểm tra thông tin đơn hàng trước khi thanh toán
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
              {/* Order Review */}
              <Card>
                <CardHeader>
                  <CardTitle>Đơn hàng của bạn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {checkoutData.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Số lượng: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span>{formatPrice(checkoutData.subtotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">
                        {formatPrice(checkoutData.total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle>Phương thức thanh toán</CardTitle>
                  <CardDescription>
                    Chọn cách thức thanh toán cho đơn hàng
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem className="space-y-4">
                        <FormControl>
                          <div className="space-y-4">
                            {/* Wallet Payment */}
                            <div
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                field.value === "wallet"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange("wallet")}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  checked={field.value === "wallet"}
                                  onChange={() => field.onChange("wallet")}
                                  className="mt-1"
                                  aria-label="Ví điện tử"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Wallet className="h-5 w-5" />
                                    <span className="font-semibold">Ví điện tử</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Số dư hiện tại:{" "}
                                    <span className="font-medium text-primary">
                                      {formatPrice(checkoutData.walletBalance)}
                                    </span>
                                  </p>
                                  {insufficientBalance && (
                                    <Alert variant="warning" className="mt-2">
                                      <AlertIcon.warning className="h-4 w-4" />
                                      <AlertDescription className="text-xs">
                                        Số dư không đủ.{" "}
                                        <Link
                                          href="/customer/wallet"
                                          className="underline font-medium"
                                        >
                                          Nạp thêm tiền
                                        </Link>
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Other Payment Methods */}
                            <div
                              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                field.value === "other"
                                  ? "border-primary bg-primary/5"
                                  : "border-border hover:border-primary/50"
                              }`}
                              onClick={() => field.onChange("other")}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="radio"
                                  checked={field.value === "other"}
                                  onChange={() => field.onChange("other")}
                                  className="mt-1"
                                  aria-label="Thẻ tín dụng/ghi nợ"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CreditCard className="h-5 w-5" />
                                    <span className="font-semibold">Thẻ tín dụng/ghi nợ</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Thanh toán trực tiếp bằng thẻ ngân hàng
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Card Information Fields (shown when "other" is selected) */}
                  {paymentMethod === "other" && (
                    <div className="space-y-4 pt-4 border-t">
                      <FormField
                        control={form.control}
                        name="cardNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Số thẻ</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1234 5678 9012 3456"
                                {...field}
                                maxLength={19}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cardHolder"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tên chủ thẻ</FormLabel>
                            <FormControl>
                              <Input placeholder="NGUYEN VAN A" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ngày hết hạn</FormLabel>
                              <FormControl>
                                <Input placeholder="MM/YY" {...field} maxLength={5} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="cvv"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CVV</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="123"
                                  {...field}
                                  maxLength={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Notice */}
              <Alert variant="info">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Thanh toán an toàn:</strong> Tiền được giữ trong Escrow cho đến khi
                  bạn xác nhận nhận hàng và kích hoạt thành công. Nếu có vấn đề, bạn có thể
                  yêu cầu hoàn tiền.
                </AlertDescription>
              </Alert>
            </div>

            {/* Sidebar - Order Summary */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Tóm tắt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span>{formatPrice(checkoutData.subtotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-primary">
                        {formatPrice(checkoutData.total)}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing || insufficientBalance}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Xác nhận đặt hàng
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Bằng việc đặt hàng, bạn đồng ý với{" "}
                    <Link href="/terms" className="underline">
                      Điều khoản dịch vụ
                    </Link>{" "}
                    của chúng tôi
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
        </Form>
      </div>
    </div>
    </RequireAuth>
  );
}

function CheckoutLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
