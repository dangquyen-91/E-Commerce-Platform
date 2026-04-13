"use client";

import { useState, useEffect, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createComplaintSchema, type CreateComplaintInput } from "@/lib/validations";
import { complaintService } from "@/lib/services/complaint.service";
import { orderService } from "@/lib/services/order.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { EvidenceUpload, type EvidenceItem } from "@/components/complaint/EvidenceUpload";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import Link from "next/link";

// Types for order items
interface OrderItemOption {
  id: string;
  orderId: string;
  orderCode: string;
  productTitle: string;
  shopName: string;
  amount: number;
  status: string;
  createdAt: string;
}

// Category options (match Swagger)
const CATEGORY_OPTIONS = [
  {
    value: "ProductQuality",
    label: "Chất lượng sản phẩm",
    description: "Sản phẩm bị lỗi/hỏng hoặc chất lượng không như mong đợi",
  },
  {
    value: "NotAsDescribed",
    label: "Không đúng mô tả",
    description: "Sản phẩm khác mô tả hoặc khác hình ảnh/ thông số",
  },
  {
    value: "MissingWrongItems",
    label: "Thiếu/Sai hàng",
    description: "Thiếu sản phẩm, hoặc nhận sai sản phẩm",
  },
  {
    value: "DeliveryIssues",
    label: "Vấn đề giao hàng",
    description: "Không nhận được sản phẩm hoặc giao không đầy đủ",
  },
  {
    value: "AccountNotWorking",
    label: "Tài khoản không hoạt động",
    description: "Không thể đăng nhập, tài khoản hết hạn/đã dùng",
  },
  {
    value: "SellerNotResponding",
    label: "Người bán không phản hồi",
    description: "Người bán không phản hồi trong thời gian dài",
  },
  {
    value: "RefundDispute",
    label: "Tranh chấp hoàn tiền",
    description: "Tranh chấp về việc hoàn tiền/hoàn một phần",
  },
] as const;

// Subcategory options (match Swagger)
const SUBCATEGORY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  ProductQuality: [
    { value: "ItemDefective", label: "Sản phẩm bị lỗi" },
    { value: "ItemDamaged", label: "Sản phẩm bị hỏng" },
  ],
  NotAsDescribed: [
    { value: "DifferentFromPhoto", label: "Khác hình ảnh" },
    { value: "DifferentSpecifications", label: "Khác thông số" },
  ],
  MissingWrongItems: [
    { value: "MissingItems", label: "Thiếu sản phẩm" },
    { value: "WrongItems", label: "Sai sản phẩm" },
  ],
  DeliveryIssues: [
    { value: "NeverDelivered", label: "Chưa nhận được" },
    { value: "PartialDelivery", label: "Giao một phần" },
  ],
  AccountNotWorking: [
    { value: "CredentialsInvalid", label: "Thông tin đăng nhập sai" },
    { value: "AccountExpired", label: "Tài khoản hết hạn" },
    { value: "AccountAlreadyUsed", label: "Tài khoản đã được sử dụng" },
  ],
  SellerNotResponding: [{ value: "NoResponse48h", label: "Không phản hồi > 48h" }],
  RefundDispute: [
    { value: "RefuseRefund", label: "Từ chối hoàn tiền" },
    { value: "PartialRefundDispute", label: "Tranh chấp hoàn một phần" },
  ],
};


function CreateComplaintContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderItemIdParam = searchParams.get("order");

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItemOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [canFileComplaint, setCanFileComplaint] = useState<boolean | null>(null);
  const [cannotFileReason, setCannotFileReason] = useState<string>("");

  const form = useForm<CreateComplaintInput>({
    resolver: zodResolver(createComplaintSchema),
    defaultValues: {
      orderItemId: orderItemIdParam || "",
      title: "",
      content: "",
      category: "" as any, // keep controlled
      subcategory: "" as any, // keep controlled
      evidence: [],
    },
  });

  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);

  // Fetch user's order items
  useEffect(() => {
    const fetchOrderItems = async () => {
      setIsLoadingOrders(true);
      try {
        const result = await orderService.getMyOrders({ limit: 50 });

        // Flatten order items from all orders
        const items: OrderItemOption[] = [];
        for (const order of result.orders) {
          try {
            const orderDetail = await orderService.getOrderByCode(order.orderCode);
            for (const item of orderDetail.items) {
              // Items in escrow flow that can be complained (Delivered or Completed)
              if (["Delivered", "Completed"].includes(item.itemStatus)) {
                items.push({
                  id: item._id,
                  orderId: order._id ?? order.id,
                  orderCode: order.orderCode,
                  productTitle: item.productId?.title || "Sản phẩm",
                  shopName: item.shopId?.name || "Shop",
                  amount: item.subtotal,
                  status: item.itemStatus,
                  createdAt: item.createdAt,
                });
              }
            }
          } catch {
            // Skip orders that can't be fetched
          }
        }

        setOrderItems(items);

        // If orderItemId is provided in URL, check if complaint can be filed
        if (orderItemIdParam) {
          try {
            const checkResult = await complaintService.checkCanFileComplaint(orderItemIdParam);
            setCanFileComplaint(checkResult.canFile);
            if (!checkResult.canFile) {
              setCannotFileReason(checkResult.reason || "Không thể tạo khiếu nại cho sản phẩm này");
            }
          } catch {
            setCanFileComplaint(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrderItems();
  }, [orderItemIdParam]);

  // Check if complaint can be filed when order item changes
  const handleOrderItemChange = async (orderItemId: string) => {
    form.setValue("orderItemId", orderItemId);

    try {
      const checkResult = await complaintService.checkCanFileComplaint(orderItemId);
      setCanFileComplaint(checkResult.canFile);
      if (!checkResult.canFile) {
        setCannotFileReason(checkResult.reason || "Không thể tạo khiếu nại cho sản phẩm này");
      } else {
        setCannotFileReason("");
      }
    } catch {
      setCanFileComplaint(true);
      setCannotFileReason("");
    }
  };

  const onSubmit = async (data: CreateComplaintInput) => {
    setIsLoading(true);
    try {
      // Normalize values for swagger
      const payload = {
        orderItemId: data.orderItemId,
        title: data.title,
        content: data.content,
        category: data.category,
        subcategory: data.subcategory ? data.subcategory : undefined,
        evidence: evidenceItems.length > 0 ? evidenceItems : undefined,
      };

      const complaint = await complaintService.createComplaint(payload as any);

      toast.success(
        "Khiếu nại đã được tạo thành công! Moderator sẽ xử lý trong thời gian sớm nhất."
      );
      router.push(`/customer/complaints/${complaint._id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tạo khiếu nại";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <RequireAuth>
      <div className="container py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/customer/orders">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Tạo khiếu nại</h1>
              <p className="text-muted-foreground">
                Gặp vấn đề với sản phẩm? Hãy cho chúng tôi biết để được hỗ trợ
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Quy trình khiếu nại</AlertTitle>
            <AlertDescription>
              Sau khi tạo khiếu nại, Moderator sẽ xem xét và đưa ra quyết định.
              Bạn có thể kháng cáo trong vòng 72 giờ nếu không đồng ý với quyết định.
            </AlertDescription>
          </Alert>

          {/* Cannot File Warning */}
          {canFileComplaint === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Không thể tạo khiếu nại</AlertTitle>
              <AlertDescription>{cannotFileReason}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Order Item Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Chọn sản phẩm
                  </CardTitle>
                  <CardDescription>Chọn sản phẩm bạn muốn khiếu nại</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrders ? (
                    <div className="space-y-2">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : orderItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Không có sản phẩm nào có thể khiếu nại</p>
                      <p className="text-sm">Bạn chỉ có thể khiếu nại các sản phẩm đã được giao</p>
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name="orderItemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sản phẩm *</FormLabel>
                          <Select onValueChange={handleOrderItemChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn sản phẩm cần khiếu nại" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {orderItems.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">{item.productTitle}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {item.orderCode} - {formatPrice(item.amount)} - {item.shopName}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Complaint Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Chi tiết khiếu nại
                  </CardTitle>
                  <CardDescription>Mô tả chi tiết vấn đề bạn gặp phải</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loại khiếu nại *</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedCategory(value);
                            form.setValue("subcategory", "" as any);
                          }}
                          value={(field.value as any) || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại khiếu nại" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                <div className="flex flex-col items-start">
                                  <span>{option.label}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {option.description}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Subcategory */}
                  {selectedCategory && SUBCATEGORY_OPTIONS[selectedCategory] && (
                    <FormField
                      control={form.control}
                      name="subcategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chi tiết loại khiếu nại</FormLabel>
                          <Select onValueChange={field.onChange} value={(field.value as any) || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn chi tiết (tùy chọn)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="__none__">Không chọn</SelectItem>
                              {SUBCATEGORY_OPTIONS[selectedCategory].map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề *</FormLabel>
                        <FormControl>
                          <Input placeholder="Tóm tắt vấn đề bạn gặp phải..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Content */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chi tiết *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả chi tiết vấn đề bạn gặp phải, các bước đã thử..."
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Cung cấp càng nhiều thông tin càng giúp Moderator xử lý nhanh hơn
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Evidence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Bằng chứng (tối đa 10)
                  </CardTitle>
                  <CardDescription>
                    Tải lên ảnh/video/tài liệu làm bằng chứng cho khiếu nại của bạn.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <EvidenceUpload
                    evidence={evidenceItems}
                    onChange={setEvidenceItems}
                    maxItems={10}
                    maxSizeMB={10}
                    disabled={isLoading}
                  />
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || canFileComplaint === false || orderItems.length === 0}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Gửi khiếu nại
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </RequireAuth>
  );
}

export default function CreateComplaintPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-8 max-w-2xl">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      }
    >
      <CreateComplaintContent />
    </Suspense>
  );
}
