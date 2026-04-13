"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { shopService, Shop } from "@/lib/services/shop.service";
import { updateShopSchema, type UpdateShopInput } from "@/lib/validations";
import { toast } from "sonner";
import { ArrowLeft, Save, Store, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditShopPage() {
  const router = useRouter();
  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<UpdateShopInput>({
    resolver: zodResolver(updateShopSchema),
    defaultValues: {
      shopName: "",
      description: "",
    },
  });

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    try {
      setIsLoading(true);
      const shopData = await shopService.getMyShop();

      if (!shopData) {
        toast.error("Bạn chưa có shop. Vui lòng đăng ký bán hàng trước.");
        // Delay redirect để toast hiển thị
        setTimeout(() => {
          router.push("/seller/register");
        }, 1500);
        return;
      }

      setShop(shopData);
      form.reset({
        shopName: shopData.shopName,
        description: shopData.description || "",
      });
    } catch (error: any) {
      console.error("Error fetching shop data:", error);
      toast.error(error.message || "Lỗi khi tải dữ liệu shop");
      // Delay redirect để toast hiển thị
      setTimeout(() => {
        router.push("/seller");
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: UpdateShopInput) => {
    if (!shop) return;

    try {
      setIsSaving(true);

      // Only send fields that have changed
      const updateData: UpdateShopInput = {};
      if (data.shopName && data.shopName !== shop.shopName) {
        updateData.shopName = data.shopName;
      }
      if (data.description !== shop.description) {
        updateData.description = data.description || undefined;
      }

      // Check if there are any changes
      if (Object.keys(updateData).length === 0) {
        toast.info("Không có thay đổi nào để lưu");
        return;
      }

      await shopService.updateShop(shop._id, updateData);
      toast.success("Cập nhật shop thành công!");
      
      // Refresh shop data
      await fetchShopData();
      
      // Optionally redirect back to shop page
      setTimeout(() => {
        router.push("/seller");
      }, 1000);
    } catch (error: any) {
      console.error("Error updating shop:", error);
      toast.error(error.message || "Lỗi khi cập nhật shop");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <RequireAuth>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </RequireAuth>
    );
  }

  if (!shop) {
    return (
      <RequireAuth>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Store className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Không tìm thấy shop</h2>
              <p className="text-muted-foreground mb-4">
                Vui lòng đăng ký bán hàng để bắt đầu
              </p>
              <Button asChild>
                <Link href="/seller/register">Đăng ký bán hàng</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/seller">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Chỉnh sửa Shop</h1>
            <p className="text-muted-foreground">
              Cập nhật thông tin shop của bạn
            </p>
          </div>
        </div>

        {/* Info Alert */}
        {shop.status !== "Active" && (
          <Alert variant="warning">
            <AlertIcon.warning className="h-4 w-4" />
            <AlertDescription>
              Shop của bạn đang ở trạng thái <strong>{shop.status}</strong>.
              Một số thay đổi có thể cần được moderator xem xét lại.
            </AlertDescription>
          </Alert>
        )}

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin Shop</CardTitle>
            <CardDescription>
              Chỉnh sửa tên và mô tả shop của bạn. Chỉ shop owner mới có thể
              cập nhật thông tin này.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Shop Name */}
                <FormField
                  control={form.control}
                  name="shopName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên Shop *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nhập tên shop"
                          {...field}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormDescription>
                        Tên shop sẽ hiển thị công khai. Tối thiểu 2 ký tự, tối
                        đa 100 ký tự.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mô tả Shop</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập mô tả về shop của bạn..."
                          className="min-h-[120px] resize-none"
                          {...field}
                          value={field.value || ""}
                          disabled={isSaving}
                        />
                      </FormControl>
                      <FormDescription>
                        Mô tả về shop, sản phẩm và dịch vụ của bạn. Tối đa 500
                        ký tự.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Read-only Info */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Trạng thái
                      </Label>
                      <p className="text-sm font-medium">{shop.status}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Ngày tạo
                      </Label>
                      <p className="text-sm">
                        {new Date(shop.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/seller")}
                    disabled={isSaving}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  );
}
