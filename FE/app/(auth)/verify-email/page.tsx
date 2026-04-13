"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema, type VerifyEmailInput } from "@/lib/validations";
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
import { Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/lib/services/auth.service";

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const form = useForm<VerifyEmailInput>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    setIsLoading(true);
    try {
      await authService.verifyEmail(data.code);
      toast.success("Email đã được xác minh thành công!");
      
      // Redirect to login or home after 1 second
      setTimeout(() => {
        window.location.href = "/login";
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Mã xác thực không hợp lệ.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await authService.resendVerificationEmail();
      toast.success("Đã gửi lại mã xác thực!");
    } catch (error: any) {
      toast.error(error.message || "Không thể gửi lại mã. Vui lòng thử lại sau.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Xác minh email</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi mã xác thực 6 ký tự đến email của bạn.
            <br />
            Vui lòng kiểm tra hộp thư và nhập mã để xác minh.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã xác thực</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-2xl tracking-widest"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Nhập mã 6 ký tự từ email</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Đang xác minh..." : "Xác minh"}
              </Button>
            </form>
          </Form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Không nhận được email?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "Đang gửi..." : "Gửi lại mã"}
            </Button>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Tại sao cần xác minh email?</p>
                <p className="text-muted-foreground text-xs">
                  Xác minh email giúp tăng Trust Level và cho phép bạn thực hiện
                  giao dịch an toàn hơn trên nền tảng.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
