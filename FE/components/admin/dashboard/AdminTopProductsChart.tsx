"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Package, Store, TrendingUp, ShoppingCart } from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import { TopSellingProductsResponse, TopSellingProductItem } from "@/types/report";
import Image from "next/image";

const formatPrice = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toString();
};

function ProductTable({ products }: { products: TopSellingProductItem[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product, index) => (
        <div
          key={product.productId}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 border"
        >
          {/* Rank */}
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{index + 1}</span>
          </div>

          {/* Thumbnail */}
          <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden bg-muted">
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.productName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" title={product.productName}>
              {product.productName}
            </p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Store className="h-3 w-3" />
              <span className="truncate" title={product.shopName}>
                {product.shopName}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-shrink-0 text-right">
            <p className="text-sm font-bold text-green-600">
              {product.totalQuantitySold} đã bán
            </p>
            <p className="text-xs text-muted-foreground">
              {formatPrice(product.totalRevenue)}đ
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminTopProductsChart() {
  const [data, setData] = useState<TopSellingProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);

        const res = await reportService.getTopSellingProducts({
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          limit: 5,
        });

        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch top products", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Top sản phẩm bán chạy</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Top sản phẩm bán chạy (30 ngày)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Tổng đã bán</p>
            <p className="text-sm font-bold text-green-600">
              {data?.summary.totalProductsSold?.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Doanh thu</p>
            <p className="text-sm font-bold text-blue-600">
              {formatPrice(data?.summary.totalRevenue || 0)}đ
            </p>
          </div>
          <div className="p-2 bg-purple-50 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Đơn hàng</p>
            <p className="text-sm font-bold text-purple-600">
              {data?.summary.totalOrders?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        {/* Product List */}
        <ProductTable products={data?.products || []} />
      </CardContent>
    </Card>
  );
}
