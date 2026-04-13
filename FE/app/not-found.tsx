import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileQuestion, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <FileQuestion className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Không tìm thấy trang</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/products">
              <Search className="h-4 w-4" />
              Tìm sản phẩm
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
