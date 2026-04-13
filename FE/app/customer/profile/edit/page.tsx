"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth";
import { authService } from "@/lib/services/auth.service";
import { uploadService } from "@/lib/services/upload.service";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Camera, User, Loader2 } from "lucide-react";
import { toast } from "sonner";

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "Tên phải có ít nhất 2 ký tự")
    .max(100, "Tên không được quá 100 ký tự"),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, "Số điện thoại phải có 10-11 chữ số")
    .optional()
    .or(z.literal("")),
});

type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function EditProfilePage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatarUrl, setNewAvatarUrl] = useState<string | null>(null);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        fullName: user.name || "",
        phone: user.phone || "",
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user, form]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    try {
      setIsUploadingAvatar(true);
      const result = await uploadService.uploadFile(file);
      setNewAvatarUrl(result.url);
      toast.success("Tải ảnh lên thành công");
    } catch (error: any) {
      toast.error(error.message || "Không thể tải ảnh lên");
      // Reset preview to original
      setAvatarPreview(user?.avatar || null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: UpdateProfileInput) => {
    setIsLoading(true);
    try {
      await authService.updateProfile({
        fullName: data.fullName,
        phone: data.phone || null,
        avatarUrl: newAvatarUrl || user?.avatar || null,
      });

      toast.success("Cập nhật hồ sơ thành công!");

      // Refresh user data
      await authService.getMe();

      setTimeout(() => {
        router.push("/customer/profile");
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <RequireAuth>
        <div className="container py-8">
          <div className="max-w-2xl mx-auto space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Link
              href="/customer/profile"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại hồ sơ
            </Link>
            <h1 className="text-3xl font-bold">Chỉnh sửa hồ sơ</h1>
            <p className="text-muted-foreground mt-2">
              Cập nhật thông tin cá nhân của bạn
            </p>
          </div>

          <div className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Ảnh đại diện
                </CardTitle>
                <CardDescription>
                  Nhấp vào ảnh để thay đổi. Hỗ trợ JPG, PNG (tối đa 5MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                      className="relative group"
                    >
                      <Avatar className="h-24 w-24 border-2 border-dashed border-muted-foreground/25 hover:border-primary transition-colors">
                        <AvatarImage src={avatarPreview || undefined} alt={user.name} />
                        <AvatarFallback className="text-2xl bg-muted">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        {isUploadingAvatar ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Camera className="h-6 w-6 text-white" />
                        )}
                      </div>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Ảnh đại diện giúp người khác nhận ra bạn dễ dàng hơn.</p>
                    {newAvatarUrl && (
                      <p className="text-green-600 mt-1">Ảnh mới đã được tải lên</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Info Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                      Cập nhật tên và số điện thoại của bạn
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Họ và tên</FormLabel>
                          <FormControl>
                            <Input placeholder="Nhập họ và tên" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Số điện thoại</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập số điện thoại (10-11 số)"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Số điện thoại được sử dụng để liên lạc khi cần thiết
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.back()}
                        disabled={isLoading}
                      >
                        Hủy
                      </Button>
                      <Button type="submit" disabled={isLoading || isUploadingAvatar}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Đang lưu...
                          </>
                        ) : (
                          "Lưu thay đổi"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Other Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt khác</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/customer/profile/change-password">
                    Đổi mật khẩu
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
