"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Đã xảy ra lỗi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Rất tiếc, đã có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại hoặc quay về trang chủ.
          </p>
          {process.env.NODE_ENV === "development" && error.message && (
            <pre className="mt-4 p-3 bg-muted rounded-md text-xs text-left overflow-auto max-h-32">
              {error.message}
            </pre>
          )}
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button variant="outline" asChild>
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
