"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  SlidersHorizontal,
  ShoppingBag,
  Store,
  ChevronDown,
  Star,
} from "lucide-react";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { inventoryService } from "@/lib/services/inventory.service";
import { toast } from "sonner";
import type { Product } from "@/types";

type SortOption = "newest" | "price_low" | "price_high" | "rating";
type PlatformFilter = "all" | string;
type DurationFilter = "all" | "1month" | "3months" | "1year";
type PackageFilter = "all" | "Personal" | "Family" | "Slot" | "Shared" | "InviteLink";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialPlatformId = searchParams.get("platformId");
  const initialShopId = searchParams.get("shopId");

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>(
    (initialPlatformId as PlatformFilter) || "all"
  );
  const [durationFilter, setDurationFilter] = useState<DurationFilter>("all");
  const [packageFilter, setPackageFilter] = useState<PackageFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const itemsPerPage = 12;
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, number>>({});
  const [inStockOnly, setInStockOnly] = useState(false);
  const [platforms, setPlatforms] = useState<Array<{ _id: string; platformName: string }>>([]);
  const [shopFilter] = useState<string | null>(initialShopId);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const filter: any = {
          page: currentPage,
          limit: itemsPerPage,
        };

        // Apply filters
        if (platformFilter !== "all") {
          filter.platformId = platformFilter;
        }
        if (packageFilter !== "all") {
          filter.planType = packageFilter;
        }
        if (shopFilter) {
          filter.shopId = shopFilter;
        }
        if (searchQuery) {
          // Backend should handle search, but for now we'll filter client-side
        }

        const response = await productService.getProducts(filter);

        console.log("[Products] Full API response:", {
          success: response.success,
          hasData: !!response.data,
          dataType: Array.isArray(response.data) ? "array" : typeof response.data,
          dataLength: Array.isArray(response.data) ? response.data.length : "N/A",
          pagination: (response as any).pagination,
        });

        if (!response.success) {
          throw new Error(response.message || "Không thể tải danh sách sản phẩm");
        }

        // BE returns: { success: true, data: Product[], pagination: {...} }
        const list = (response.data as any) || [];
        console.log("[Products] fetched list", { filter, count: list.length });
        
        // Debug: Check if salesCount is present in ALL products
        if (list.length > 0) {
          console.log("[Products] First product sample:", {
            id: list[0]._id || list[0].id,
            title: list[0].title,
            hasSalesCount: list[0].salesCount !== undefined,
            salesCount: list[0].salesCount,
            salesCountType: typeof list[0].salesCount,
            allKeys: Object.keys(list[0]),
            fullProduct: list[0],
          });
          
          // Check all products for salesCount
          const productsWithSales = list.filter((p: any) => p.salesCount !== undefined);
          const productsWithoutSales = list.filter((p: any) => p.salesCount === undefined);
          console.log("[Products] Sales count stats:", {
            total: list.length,
            withSalesCount: productsWithSales.length,
            withoutSalesCount: productsWithoutSales.length,
            sampleWithoutSales: productsWithoutSales[0] ? {
              id: productsWithoutSales[0]._id || productsWithoutSales[0].id,
              title: productsWithoutSales[0].title,
            } : null,
          });
        }
        
        setProducts(list);

        // Extract unique platforms from products
        const uniquePlatforms = new Map<string, { _id: string; platformName: string }>();
        list.forEach((p: Product) => {
          const platform = p.platformId || p.platform;
          if (platform && typeof platform === "object") {
            const platformObj = platform as { _id?: string; id?: string; platformName?: string };
            const platformId = platformObj._id || platformObj.id;
            if (platformId) {
              uniquePlatforms.set(platformId, {
                _id: platformId,
                platformName: platform.platformName || "Unknown",
              });
            }
          }
        });
        setPlatforms(Array.from(uniquePlatforms.values()));

        setPagination(
          (response as any).pagination || {
            page: currentPage,
            limit: itemsPerPage,
            total: 0,
            totalPages: 1,
          }
        );

        // Fetch inventory counts for each product (available items)
        try {
          const entries = await Promise.all(
            list.map(async (p: any) => {
              const id = p._id || p.id;
              if (!id) return [null, 0] as const;
              try {
                const count = await inventoryService.getAvailableCount(id);
                return [id as string, count] as const;
              } catch {
                return [id as string, 0] as const;
              }
            })
          );
          const counts: Record<string, number> = {};
          for (const [id, count] of entries) {
            if (id) counts[id] = count;
          }
          setInventoryCounts(counts);
        } catch (err) {
          console.error("Failed to fetch inventory counts:", err);
          setInventoryCounts({});
        }
      } catch (error: any) {
        // Debug: Log chi tiết error để dễ debug
        console.error("[Products] Failed to fetch products:", {
          message: error?.message || "Unknown error",
          status: error?.status,
          response: error?.response?.data,
          stack: error?.stack,
          raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
        toast.error(error?.message || "Không thể tải danh sách sản phẩm");
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, platformFilter, packageFilter, searchQuery, shopFilter]);

  // Filter và sort products (client-side filtering for search)
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter (client-side if backend doesn't support)
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (typeof p.platform === "object" 
            ? p.platform.platformName?.toLowerCase().includes(searchQuery.toLowerCase())
            : false)
      );
    }

    // Duration filter (client-side)
    if (durationFilter !== "all") {
      const durationDaysMap: Record<string, number> = {
        "1month": 30,
        "3months": 90,
        "1year": 365,
      };
      filtered = filtered.filter(
        (p) => p.durationDays === durationDaysMap[durationFilter]
      );
    }

    // In-stock filter (requires inventoryCounts)
    if (inStockOnly) {
      filtered = filtered.filter((p) => {
        const id = (p as any)._id || (p as any).id;
        const count = inventoryCounts[id as string] ?? 0;
        return count > 0;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return a.price - b.price;
        case "price_high":
          return b.price - a.price;
        case "rating":
          const aRating = (a as unknown as ProductResponse).avgRating || 0;
          const bRating = (b as unknown as ProductResponse).avgRating || 0;
          return bRating - aRating;
        case "newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [products, searchQuery, sortBy, durationFilter, inStockOnly, inventoryCounts]);

  // Pagination
  const totalPages = pagination.totalPages || Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const paginatedProducts = filteredAndSortedProducts;

  const hasActiveFilters =
    platformFilter !== "all" ||
    durationFilter !== "all" ||
    packageFilter !== "all" ||
    inStockOnly;

  const resetFilters = () => {
    setPlatformFilter("all");
    setDurationFilter("all");
    setPackageFilter("all");
    setInStockOnly(false);
    setSearchQuery("");
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col gap-4">
          {/* Compact Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sản phẩm..."
                className="pl-10 h-10 text-sm bg-background border focus:border-primary transition-colors rounded-lg"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Sort */}
            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortOption)}
            >
              <SelectTrigger className="w-full sm:w-[150px] h-10 text-sm bg-background border rounded-lg">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="price_low">Giá thấp → cao</SelectItem>
                <SelectItem value="price_high">Giá cao → thấp</SelectItem>
                <SelectItem value="rating">Đánh giá cao</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter Toggle Button */}
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-10 px-4 rounded-lg"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Bộ lọc
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                  {[platformFilter !== "all", durationFilter !== "all", packageFilter !== "all", inStockOnly].filter(Boolean).length}
                </Badge>
              )}
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <Card className="border shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3 items-center">
                  <Select
                    value={platformFilter}
                    onValueChange={(value) => {
                      setPlatformFilter(value as PlatformFilter);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-auto min-w-[130px] h-9 text-sm bg-background border rounded-lg">
                      <SelectValue placeholder="Nền tảng" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả nền tảng</SelectItem>
                      {platforms.map((platform) => (
                        <SelectItem key={platform._id} value={platform._id}>
                          {platform.platformName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={durationFilter}
                    onValueChange={(value) => {
                      setDurationFilter(value as DurationFilter);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-auto min-w-[110px] h-9 text-sm bg-background border rounded-lg">
                      <SelectValue placeholder="Thời hạn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="1month">1 tháng</SelectItem>
                      <SelectItem value="3months">3 tháng</SelectItem>
                      <SelectItem value="1year">1 năm</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={packageFilter}
                    onValueChange={(value) => {
                      setPackageFilter(value as PackageFilter);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-auto min-w-[110px] h-9 text-sm bg-background border rounded-lg">
                      <SelectValue placeholder="Loại gói" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="Personal">Cá nhân</SelectItem>
                      <SelectItem value="Family">Gia đình</SelectItem>
                      <SelectItem value="Slot">Slot</SelectItem>
                      <SelectItem value="Shared">Shared</SelectItem>
                      <SelectItem value="InviteLink">Invite Link</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant={inStockOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setInStockOnly((prev) => !prev);
                      setCurrentPage(1);
                    }}
                    className="h-9 text-sm rounded-lg"
                  >
                    {inStockOnly ? "✓ Còn hàng" : "Chỉ còn hàng"}
                  </Button>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                      className="h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Xóa lọc
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredAndSortedProducts.length > 0 ? (
                <>Tìm thấy <span className="font-semibold text-foreground">{filteredAndSortedProducts.length}</span> sản phẩm</>
              ) : !isLoading ? (
                "Không tìm thấy sản phẩm"
              ) : null}
            </p>
          </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-md">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : paginatedProducts.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                <Package className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Không tìm thấy sản phẩm
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để xem thêm kết quả
              </p>
              {hasActiveFilters && (
                <Button onClick={resetFilters} variant="default" size="lg">
                  Đặt lại bộ lọc
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {paginatedProducts.map((product, index) => {
                const stockCount = inventoryCounts[(product as any)._id || (product as any).id || ""] ?? 0;
                const isInStock = stockCount > 0;
                const salesCount = (product as any).salesCount ?? 0;
                const productId = (product as any)._id || (product as any).id;

                // Debug log - only for first 3 products
                if (index < 3) {
                  console.log("[Product Card] Product:", {
                    index,
                    id: productId,
                    title: product.title,
                    salesCount,
                    hasSalesCount: (product as any).salesCount !== undefined,
                    rawProduct: product,
                  });
                }

                return (
                  <Card
                    key={product._id || product.id}
                    className="group relative overflow-hidden border-0 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 h-full flex flex-col bg-card"
                  >
                    <Link href={`/products/${product._id || product.id}`} prefetch={true} className="flex-1 flex flex-col">
                      {/* Thumbnail */}
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                        {(product as any).thumbnailUrl ? (
                          <Image
                            src={(product as any).thumbnailUrl}
                            alt={product.title}
                            fill
                            className="object-contain group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                            unoptimized={(product as any).thumbnailUrl?.startsWith("data:")}
                          />
                        ) : null}
                        {/* Fallback icon */}
                        {!(product as any).thumbnailUrl && (
                          <div className="absolute inset-0 h-full w-full flex items-center justify-center">
                            <Package className="h-16 w-16 text-muted-foreground/30" />
                          </div>
                        )}

                        {/* Badges overlay - Top Left */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                          <Badge className="bg-primary text-primary-foreground shadow-lg text-xs font-medium">
                            {typeof (product as any).platformId === "object"
                              ? ((product as any).platformId.platformName || "N/A")
                              : (typeof (product as any).platform === "object"
                                ? ((product as any).platform.platformName || "N/A")
                                : "N/A")}
                          </Badge>
                        </div>

                        {/* Stock indicator - Top Right */}
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
                          <Badge
                            variant={isInStock ? "default" : "destructive"}
                            className={isInStock
                              ? "bg-green-500 text-white shadow-lg text-xs"
                              : "shadow-lg text-xs"
                            }
                          >
                            {isInStock ? `Còn ${stockCount}` : "Hết hàng"}
                          </Badge>
                        </div>

                        {/* Sales count - Bottom Left - Always show */}
                        <div className="absolute bottom-3 left-3 z-10">
                          <Badge className="bg-violet-600 text-white shadow-lg text-xs font-medium flex items-center gap-1">
                            <ShoppingBag className="h-3 w-3" />
                            <span>Đã bán: {salesCount ?? 0}</span>
                          </Badge>
                        </div>
                      </div>

                      <CardContent className="p-4 flex-1 flex flex-col">
                        {/* Tags row */}
                        <div className="flex gap-1.5 flex-wrap mb-3">
                          <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                            {product.planType}
                          </Badge>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full">
                            {product.durationDays} ngày
                          </Badge>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors mb-2 flex-1">
                          {product.title}
                        </h3>

                        {/* Shop info */}
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                          <Store className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {(() => {
                              const shopData = (product as any).shopId || (product as any).shop;
                              if (shopData && typeof shopData === "object" && shopData.shopName) {
                                return shopData.shopName;
                              }
                              return "N/A";
                            })()}
                          </span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 text-sm mb-3">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {(product as any).avgRating ? (product as any).avgRating.toFixed(1) : "0"}
                          </span>
                          <span className="text-muted-foreground">
                            ({(product as any).reviewCount ?? 0} đánh giá)
                          </span>
                        </div>

                        {/* Price & Buy button */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            <span className="text-xl font-bold text-primary">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            className="shadow-md hover:shadow-lg transition-shadow"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              globalThis.window.location.href = `/products/${product._id || product.id}`;
                            }}
                          >
                            <ShoppingBag className="h-4 w-4 mr-1.5" />
                            Mua ngay
                          </Button>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 md:gap-2 mt-8 md:mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 rounded-lg"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Trước
                </Button>

                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "ghost"}
                        className={`h-10 w-10 rounded-lg text-sm font-medium ${
                          pageNum === currentPage
                            ? "shadow-md"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                        aria-label={`Trang ${pageNum}`}
                        aria-current={pageNum === currentPage ? "page" : undefined}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 rounded-lg"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Trang sau"
                >
                  Sau
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
        <div className="flex flex-col gap-4">
          {/* Search bar skeleton */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-[150px] rounded-lg" />
            <Skeleton className="h-10 w-[100px] rounded-lg" />
          </div>
          <Skeleton className="h-5 w-32" />
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border shadow-sm">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-3 space-y-2">
                  <div className="flex gap-1.5">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
