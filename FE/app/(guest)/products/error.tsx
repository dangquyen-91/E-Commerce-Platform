"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ProductsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Products page error:", error);
  }, [error]);

  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle>Không thể tải sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Đã xảy ra lỗi khi tải danh sách sản phẩm. Vui lòng thử lại.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button onClick={reset} size="sm">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
