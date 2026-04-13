"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shopService, type Shop } from "@/lib/services/shop.service";
import { Store, ChevronLeft } from "lucide-react";
import { ShopReviews } from "@/components/reviews";

export default function ShopReviewsPage() {
  const params = useParams<{ id: string }>();
  const shopId = params.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchShop = async () => {
      setIsLoading(true);
      try {
        const shopData = await shopService.getShopById(shopId);
        setShop(shopData);
      } catch (error) {
        console.error("Failed to load shop:", error);
        setShop(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, [shopId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Store className="h-12 w-12 text-muted-foreground mx-auto" />
            <h1 className="text-xl font-semibold">Shop không tồn tại</h1>
            <p className="text-sm text-muted-foreground">
              Shop này có thể đã bị xóa hoặc tạm ẩn khỏi hệ thống.
            </p>
            <Button asChild>
              <Link href="/sellers">Quay lại danh sách người bán</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href={`/shops/${shopId}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Quay lại shop
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">
              Đánh giá của {shop.shopName}
            </h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            Tất cả đánh giá từ khách hàng
          </p>
        </div>
      </div>

      {/* Full Reviews - không giới hạn, có phân trang */}
      <ShopReviews shopId={shopId} />
    </div>
  );
}
