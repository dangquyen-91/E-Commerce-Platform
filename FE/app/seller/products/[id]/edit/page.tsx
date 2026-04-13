"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateProductSchema,
  type UpdateProductInput,
} from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RequireAuth } from "@/components/auth/RequireAuth";
import {
  Card,
  CardContent,
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
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { productService } from "@/lib/services/product.service";
import { uploadService } from "@/lib/services/upload.service";
import { type ApiError } from "@/lib/api";
import { useShop } from "@/lib/hooks/useShop";
import { Skeleton } from "@/components/ui/skeleton";
import { platformCatalogService, type PlatformCatalog } from "@/lib/services/platform-catalog.service";
import { X, ImageIcon, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const { shop, loading: shopLoading, hasActiveShop } = useShop();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [platforms, setPlatforms] = useState<PlatformCatalog[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [currentThumbnail, setCurrentThumbnail] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<UpdateProductInput>({
    resolver: zodResolver(updateProductSchema),
    defaultValues: {
      title: "",
      description: "",
      warrantyPolicy: "",
      howToUse: "",
      thumbnailUrl: null,
      planType: "Personal",
      durationDays: 30,
      price: 0,
    },
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getMyProductById(productId);
        if (response.success && response.data) {
          const product = response.data;
          form.reset({
            title: product.title,
            description: product.description,
            warrantyPolicy: product.warrantyPolicy,
            howToUse: product.howToUse,
            thumbnailUrl: product.thumbnailUrl || null,
            planType: product.planType,
            durationDays: product.durationDays,
            price: product.price,
            platformId: product.platformId,
          });
          if (product.thumbnailUrl) {
            setCurrentThumbnail(product.thumbnailUrl);
          }
        } else {
          toast.error("Không tìm thấy sản phẩm");
          router.push("/seller/products");
        }
      } catch (error) {
        toast.error("Lỗi khi tải thông tin sản phẩm");
        router.push("/seller/products");
      } finally {
        setIsFetching(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, form, router]);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await platformCatalogService.getAll();
        setPlatforms(data.filter((p) => p.status === "Active"));
      } catch {
        toast.error("Không thể tải danh mục nền tảng");
      }
    };

    fetchPlatforms();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Chỉ chấp nhận file ảnh (JPEG, PNG, WebP)");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Kích thước ảnh tối đa là 5MB");
      return;
    }

    setThumbnailFile(file);
    setCurrentThumbnail(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setCurrentThumbnail(null);
    form.setValue("thumbnailUrl", null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: UpdateProductInput) => {
    setIsLoading(true);
    try {
      let thumbnailUrl: string | null | undefined = currentThumbnail;

      if (thumbnailFile) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadService.uploadProductImage(thumbnailFile);
          thumbnailUrl = uploadResult.url;
        } catch (uploadError) {
          const err = uploadError as ApiError;
          toast.error(err.message || "Lỗi khi tải ảnh lên");
          setIsUploading(false);
          setIsLoading(false);
          return;
        }
        setIsUploading(false);
      } else if (!currentThumbnail && !thumbnailPreview) {
        thumbnailUrl = null;
      }

      const payload: UpdateProductInput = {
        ...data,
        durationDays: Number(data.durationDays),
        price: Number(data.price),
        thumbnailUrl: thumbnailUrl,
      };

      const response = await productService.updateProduct(productId, payload);

      if (!response.success) {
        toast.error(response.message || "Lỗi khi cập nhật sản phẩm");
        return;
      }

      toast.success("Cập nhật sản phẩm thành công!");
      router.push("/seller/products");
      router.refresh();
    } catch (error) {
      const err = error as ApiError;
      toast.error(err.message || "Lỗi khi cập nhật sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  if (shopLoading || isFetching) {
    return (
      <div className="container py-8 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasActiveShop) {
    return (
      <div className="container py-8 max-w-4xl text-center">
        <h2 className="text-2xl font-bold mb-4">Bạn chưa có cửa hàng</h2>
        <p className="text-muted-foreground mb-6">
          Vui lòng tạo một cửa hàng trước khi chỉnh sửa sản phẩm.
        </p>
        <Button onClick={() => router.push("/seller/register")}>
          Tạo cửa hàng ngay
        </Button>
      </div>
    );
  }

  return (
    <RequireAuth requiredRole="seller">
      <div className="container py-8 max-w-4xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/seller/products">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chỉnh sửa sản phẩm</h1>
              <p className="text-muted-foreground">
                Cập nhật thông tin sản phẩm của bạn
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiêu đề sản phẩm *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ví dụ: Key bản quyền Windows 11 Pro"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                    <FormLabel>Ảnh sản phẩm</FormLabel>
                    <div className="space-y-4">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="thumbnail-upload"
                      />

                      {(thumbnailPreview || currentThumbnail) ? (
                        <div className="relative inline-block">
                          <img
                            src={thumbnailPreview || currentThumbnail || ""}
                            alt="Preview"
                            className="w-40 h-40 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="thumbnail-upload"
                          className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary transition-colors"
                        >
                          <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Chọn ảnh</span>
                          <span className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP</span>
                        </label>
                      )}

                      {thumbnailFile && (
                        <p className="text-sm text-muted-foreground">
                          {thumbnailFile.name} ({(thumbnailFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                  </FormItem>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mô tả chi tiết *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Mô tả các tính năng, lợi ích, và thông tin quan trọng khác của sản phẩm."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chính sách & Hướng dẫn</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="warrantyPolicy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chính sách bảo hành *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Quy định về việc bảo hành sản phẩm."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="howToUse"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hướng dẫn sử dụng *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Các bước để kích hoạt hoặc sử dụng sản phẩm."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Phân loại & Giá</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="platformId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nền tảng *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn nền tảng cho sản phẩm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {platforms.length === 0 ? (
                              <SelectItem value="__empty" disabled>
                                Không có nền tảng khả dụng
                              </SelectItem>
                            ) : (
                              platforms.map((platform) => (
                                <SelectItem key={platform._id} value={platform._id}>
                                  {platform.platformName}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="planType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại gói *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại gói" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Personal">Cá nhân</SelectItem>
                              <SelectItem value="Family">Gia đình</SelectItem>
                              <SelectItem value="Slot">Slot</SelectItem>
                              <SelectItem value="Shared">Dùng chung</SelectItem>
                              <SelectItem value="InviteLink">Mời qua link</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="durationDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thời hạn (ngày) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="365"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Giá (VND) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              step={1}
                              placeholder="100000"
                              value={
                                field.value === undefined || field.value === null
                                  ? ""
                                  : field.value
                              }
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === "") {
                                  field.onChange(undefined);
                                  return;
                                }
                                const num = Number(value);
                                if (!Number.isNaN(num)) {
                                  field.onChange(num);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4 justify-end">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isLoading || isUploading}>
                  {isUploading ? "Đang tải ảnh..." : isLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </RequireAuth>
  );
}
