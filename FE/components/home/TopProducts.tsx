"use client";

import { FadeIn } from "@/components/animations";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Loader2 } from "lucide-react";
import { useTopProducts } from "@/lib/hooks/useProducts";
import Link from "next/link";

export function TopProducts() {
  const { products, loading, error } = useTopProducts(5);

  return (
    <FadeIn direction="right" delay={0.3}>
      <div className="backdrop-blur-md bg-white/90 rounded-2xl border border-white/20 p-6 h-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-foreground drop-shadow-sm">TOP SẢN PHẨM</h3>
          <Badge variant="outline" className="text-violet-600 border-violet-200">
            7 ngày qua
          </Badge>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-10 text-muted-foreground text-sm">
            <p>Không thể tải dữ liệu</p>
            {error && <p className="text-xs mt-2 text-red-500">{error}</p>}
          </div>
        )}

        {/* Products List */}
        {!loading && !error && (
          <div className="space-y-4">
            {products.length > 0 ? (
              products.map((product, index) => (
                <Link
                  key={product._id || product.id}
                  href={`/products/${product._id || product.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer"
                >
                  {/* Rank */}
                  <span className="text-lg font-bold text-muted-foreground w-6">
                    {index + 1}
                  </span>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">
                    {product.title?.charAt(0) || "P"}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{product.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-sm text-muted-foreground">
                        {product.price?.toLocaleString("vi-VN")}đ
                      </p>
                      {product.salesCount !== undefined && product.salesCount > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                          Đã bán: {product.salesCount}
                        </Badge>
                      )}
                      {product.avgRating !== undefined && product.avgRating > 0 && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5 text-yellow-600 border-yellow-300">
                          ⭐ {product.avgRating.toFixed(1)}
                          {product.reviewCount !== undefined && product.reviewCount > 0 && (
                            <span className="ml-1">({product.reviewCount})</span>
                          )}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Trending indicator */}
                  <div className="flex items-center gap-1 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <p>Chưa có sản phẩm nào</p>
              </div>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
