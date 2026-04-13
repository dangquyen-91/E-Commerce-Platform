"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { Search, Store, Star, Package, ArrowRight, ShieldCheck, Users } from "lucide-react";
import type { Product } from "@/types";

interface Seller {
  _id: string;
  shopName: string;
  description?: string;
  ratingAvg: number;
  totalSales: number;
  productCount: number;
  status: string;
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSellers = async () => {
      setIsLoading(true);
      try {
        const response = await productService.getProducts({ limit: 500 });

        if (response.success && response.data) {
          const list = (response.data ?? []) as ProductResponse[];
          console.log("[Sellers] Fetched products for sellers page:", list.length);

          // Extract unique shops from products
          const shopMap = new Map<string, Seller>();
          list.forEach((p) => {
            const shop = (p as any).shopId || (p as any).shop;
            if (shop && typeof shop === "object") {
              const shopObj = shop as {
                _id?: string;
                id?: string;
                shopName?: string;
                name?: string;
                description?: string;
                ratingAvg?: number;
                totalSales?: number;
                status?: string;
              };
              const shopId = shopObj._id || shopObj.id;
              const shopName = shopObj.shopName || shopObj.name || "Unknown Shop";
              if (shopId) {
                const existing = shopMap.get(shopId);
                if (existing) {
                  existing.productCount += 1;
                } else {
                  shopMap.set(shopId, {
                    _id: shopId,
                    shopName,
                    description: shopObj.description,
                    ratingAvg: shopObj.ratingAvg || 0,
                    totalSales: shopObj.totalSales || 0,
                    productCount: 1,
                    status: shopObj.status || "Active",
                  });
                }
              }
            }
          });

          // Only show Active shops
          const activeShops = Array.from(shopMap.values())
            .filter((s) => s.status === "Active")
            .sort((a, b) => b.totalSales - a.totalSales || b.productCount - a.productCount);
          setSellers(activeShops);
        }
      } catch (error) {
        console.error("Error fetching sellers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellers();
  }, []);

  const filteredSellers = sellers.filter((s) =>
    s.shopName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-primary/5 via-primary/0 to-background border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-2">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Người bán uy tín
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Khám phá các shop đã được xác thực với đánh giá tốt từ cộng đồng
            </p>
          </div>
        </div>
      </div>

      {/* Search & Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Search Bar */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm kiếm người bán..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{sellers.length} người bán</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{sellers.reduce((sum, s) => sum + s.productCount, 0)} sản phẩm</span>
            </div>
          </div>
        )}

        {/* Sellers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className="text-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy người bán</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Chưa có người bán nào"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredSellers.map((seller) => (
              <Link
                key={seller._id}
                href={`/shops/${seller._id}`}
                className="block h-full"
              >
                <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border-2 border-primary/20">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-lg font-bold">
                          {seller.shopName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                            {seller.shopName}
                          </h3>
                          <ShieldCheck className="h-4 w-4 text-green-500 shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {renderStars(seller.ratingAvg)}
                          <span className="text-sm text-muted-foreground">
                            ({seller.ratingAvg.toFixed(1)})
                          </span>
                        </div>
                        {seller.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {seller.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-primary">{seller.productCount}</div>
                          <div className="text-xs text-muted-foreground">Sản phẩm</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600">{seller.totalSales}</div>
                          <div className="text-xs text-muted-foreground">Đã bán</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-4 w-4" />
                        <span>Xem shop & sản phẩm</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
