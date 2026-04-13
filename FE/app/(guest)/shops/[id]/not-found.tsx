import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Store, ArrowLeft, Search } from "lucide-react";

export default function ShopNotFound() {
  return (
    <div className="container mx-auto py-16 px-4">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Store className="h-7 w-7 text-muted-foreground" />
          </div>
          <CardTitle>Cửa hàng không tồn tại</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Cửa hàng bạn đang tìm kiếm không tồn tại hoặc đã ngừng hoạt động.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button size="sm" asChild>
            <Link href="/sellers">
              <Search className="h-4 w-4" />
              Tìm cửa hàng khác
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/sellers">
              <ArrowLeft className="h-4 w-4" />
              Danh sách cửa hàng
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
