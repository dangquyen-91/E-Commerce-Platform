"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Store, AlertTriangle, Star, TrendingUp } from "lucide-react";
import { reportService } from "@/lib/services/report.service";
import { ShopRankingResponse, ShopRankingItem } from "@/types/report";

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

function ShopTable({
  shops,
  highlightField,
}: {
  shops: ShopRankingItem[];
  highlightField: "revenue" | "complaintCount";
}) {
  if (shops.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        Chưa có dữ liệu
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 font-medium">#</th>
            <th className="text-left py-2 font-medium">Shop</th>
            <th className="text-right py-2 font-medium">Doanh thu</th>
            <th className="text-right py-2 font-medium">Đơn</th>
            <th className="text-center py-2 font-medium">Rating</th>
            <th className="text-right py-2 font-medium">Khiếu nại</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop, index) => (
            <tr key={shop.shopId} className="border-b last:border-0 hover:bg-muted/50">
              <td className="py-2 font-medium">{index + 1}</td>
              <td className="py-2">
                <div className="flex items-center gap-1.5">
                  <Store className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[100px]" title={shop.shopName}>
                    {shop.shopName}
                  </span>
                </div>
              </td>
              <td className={`text-right py-2 ${highlightField === "revenue" ? "font-bold text-green-600" : ""}`}>
                {formatPrice(shop.revenue)}đ
              </td>
              <td className="text-right py-2">{shop.orderCount}</td>
              <td className="text-center py-2">
                <div className="flex items-center justify-center gap-0.5">
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  <span>{shop.rating.toFixed(1)}</span>
                </div>
              </td>
              <td className={`text-right py-2 ${highlightField === "complaintCount" ? "font-bold text-red-600" : ""}`}>
                {shop.complaintCount > 0 ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    {shop.complaintCount}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminShopRankingChart() {
  const [data, setData] = useState<ShopRankingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Get last 30 days
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);

        const res = await reportService.getShopRankings({
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          limit: 5,
        });

        if (res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch shop rankings", err);
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
          <CardTitle className="text-base font-medium">Xếp hạng Shop</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Store className="h-4 w-4" />
          Xếp hạng Shop (30 ngày)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-blue-50 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Shop hoạt động</p>
            <p className="text-sm font-bold text-blue-600">
              {data?.summary.totalActiveShops || 0}
            </p>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Rating TB</p>
            <div className="flex items-center justify-center gap-0.5">
              <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              <span className="text-sm font-bold text-yellow-600">
                {data?.summary.avgRating.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <p className="text-[10px] text-muted-foreground">Khiếu nại</p>
            <p className="text-sm font-bold text-red-600">
              {data?.summary.totalComplaints || 0}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-8">
            <TabsTrigger value="revenue" className="text-xs h-7">
              <TrendingUp className="h-3 w-3 mr-1" />
              Top doanh thu
            </TabsTrigger>
            <TabsTrigger value="complaints" className="text-xs h-7">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Nhiều khiếu nại
            </TabsTrigger>
          </TabsList>
          <TabsContent value="revenue" className="mt-3">
            <ShopTable
              shops={data?.topByRevenue || []}
              highlightField="revenue"
            />
          </TabsContent>
          <TabsContent value="complaints" className="mt-3">
            <ShopTable
              shops={data?.topByComplaints || []}
              highlightField="complaintCount"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
