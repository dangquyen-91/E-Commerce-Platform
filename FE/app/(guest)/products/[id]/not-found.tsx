import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageX, ArrowLeft, Search } from "lucide-react";

export default function ProductNotFound() {
  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <PackageX className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle>Sản phẩm không tồn tại</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa khỏi hệ thống.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button size="sm" asChild>
            <Link href="/products">
              <Search className="h-4 w-4" />
              Tìm sản phẩm khác
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
              Danh sách sản phẩm
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
