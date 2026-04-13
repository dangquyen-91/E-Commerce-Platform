"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { Search, Layers, Package, ArrowRight } from "lucide-react";

interface Platform {
  _id: string;
  platformName: string;
  logoUrl?: string;
  productCount: number;
}

export default function CategoriesPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchPlatforms = async () => {
      setIsLoading(true);
      try {
        const response = await productService.getProducts({ limit: 500 });

        if (response.success && response.data) {
          const list = (response.data ?? []) as ProductResponse[];

          // Extract unique platforms from products
          const platformMap = new Map<string, Platform>();
          console.log("[Categories] Fetched products for categories:", list.length);
          list.forEach((p) => {
            const platform = (p as any).platformId || (p as any).platform;
            if (platform && typeof platform === "object") {
              const platformObj = platform as {
                _id?: string;
                id?: string;
                platformName?: string;
                name?: string;
                logoUrl?: string;
              };
              const platformId = platformObj._id || platformObj.id;
              const platformName = platformObj.platformName || platformObj.name || "Unknown";
              if (platformId) {
                const existing = platformMap.get(platformId);
                if (existing) {
                  existing.productCount += 1;
                } else {
                  platformMap.set(platformId, {
                    _id: platformId,
                    platformName,
                    logoUrl: platformObj.logoUrl,
                    productCount: 1,
                  });
                }
              }
            }
          });

          setPlatforms(Array.from(platformMap.values()).sort((a, b) => b.productCount - a.productCount));
        }
      } catch (error) {
        console.error("Error fetching platforms:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlatforms();
  }, []);

  const filteredPlatforms = platforms.filter((p) =>
    p.platformName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-linear-to-r from-primary/5 via-primary/0 to-background border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
          <div className="max-w-3xl mx-auto text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2 bg-primary/10 rounded-full mb-2">
              <Layers className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Danh mục sản phẩm
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
              Khám phá các nền tảng và dịch vụ số hàng đầu với giá tốt nhất
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
              placeholder="Tìm kiếm danh mục..."
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
              <Layers className="h-4 w-4" />
              <span>{platforms.length} danh mục</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{platforms.reduce((sum, p) => sum + p.productCount, 0)} sản phẩm</span>
            </div>
          </div>
        )}

        {/* Categories Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : filteredPlatforms.length === 0 ? (
          <div className="text-center py-16">
            <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Không tìm thấy danh mục</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Thử tìm kiếm với từ khóa khác" : "Chưa có danh mục nào"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredPlatforms.map((platform) => (
              <Link
                key={platform._id}
                href={`/products?platformId=${platform._id}`}
                className="group"
              >
                <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border">
                      {platform.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={platform.logoUrl}
                          alt={platform.platformName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-primary" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-base group-hover:text-primary transition-colors line-clamp-2">
                        {platform.platformName}
                      </h3>
                      <Badge variant="secondary" className="font-normal">
                        {platform.productCount} sản phẩm
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Xem sản phẩm</span>
                      <ArrowRight className="h-4 w-4" />
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
