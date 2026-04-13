"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { shopService, type Shop } from "@/lib/services/shop.service";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { inventoryService } from "@/lib/services/inventory.service";
import { Package, Store, Star, MessageCircle } from "lucide-react";
import { ShopReviews } from "@/components/reviews";
import { ChatWithShopButton } from "@/components/chat";

const formatPrice = (price: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

export default function PublicShopPage() {
  const params = useParams<{ id: string }>();
  const shopId = params.id;

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [stockCounts, setStockCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [shopData, productRes] = await Promise.all([
          shopService.getShopById(shopId),
          productService.getProducts({ shopId }),
        ]);

        const productList = productRes.data || [];

        setShop(shopData);
        setProducts(productList);

        // Fetch stock counts for all products
        if (productList.length > 0) {
          const counts: Record<string, number> = {};
          await Promise.all(
            productList.map(async (p) => {
              const productId = p._id || p.id!;
              try {
                counts[productId] = await inventoryService.getAvailableCount(productId);
              } catch {
                counts[productId] = 0;
              }
            })
          );
          setStockCounts(counts);
        }
      } catch (error) {
        console.error("Failed to load shop detail:", error);
        setShop(null);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [shopId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
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

  // Get ownerId safely from populated shop data
  const ownerId = typeof (shop as any).ownerUserId === 'string' 
    ? (shop as any).ownerUserId 
    : (shop as any).ownerUserId?._id || (shop as any).ownerId;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">{shop.shopName}</h1>
          </div>
          <p className="text-sm md:text-base text-muted-foreground">
            {shop.description || "Shop chưa có mô tả."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChatWithShopButton
            shopId={shop._id}
            shopName={shop.shopName}
            sellerUserId={ownerId}
            variant="outline"
          />
          <Button asChild variant="outline">
            <Link href={`/products?shopId=${shop._id}`}>Xem tất cả sản phẩm</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sản phẩm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đánh giá</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="text-lg font-semibold">{shop.ratingAvg?.toFixed(1) ?? "0.0"}</span>
              <span className="text-sm text-muted-foreground">({shop.reviewCount ?? 0})</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tỷ lệ phản hồi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="text-lg font-semibold text-blue-600">{shop.responseRate ?? 0}%</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Đã bán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{shop.totalSales ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{shop.status}</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Products list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">Sản phẩm của shop</CardTitle>
          <CardDescription>Các gói tài khoản số shop đang bán.</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Shop chưa có sản phẩm nào.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {products.map((p) => {
                const id = p._id || p.id!;
                return (
                  <Link key={id} href={`/products/${id}`} className="group">
                    <Card className="h-full hover:shadow-md transition-shadow overflow-hidden">
                      <CardContent className="p-0">
                        {p.thumbnailUrl && (
                          <div className="relative aspect-video w-full overflow-hidden bg-muted">
                            <Image
                              src={p.thumbnailUrl}
                              alt={p.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                              unoptimized={p.thumbnailUrl?.startsWith("data:")}
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <div className="flex items-start gap-2">
                            <Package className="h-4 w-4 text-primary mt-0.5" />
                            <h3 className="font-semibold text-sm md:text-base line-clamp-2 group-hover:text-primary">
                              {p.title}
                            </h3>
                          </div>
                          <div className="text-xs md:text-sm text-muted-foreground">
                            {p.durationDays} ngày • {p.planType}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="text-base font-bold text-primary">
                              {formatPrice(p.price)}
                            </div>
                            <Badge variant={stockCounts[id] > 0 ? "secondary" : "destructive"}>
                              {stockCounts[id] !== undefined
                                ? stockCounts[id] > 0
                                  ? `Còn ${stockCounts[id]}`
                                  : "Hết hàng"
                                : "..."}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shop Reviews - chỉ hiển thị 3 đánh giá mới nhất */}
      <ShopReviews shopId={shopId} limit={3} showViewAll />
    </div>
  );
}
