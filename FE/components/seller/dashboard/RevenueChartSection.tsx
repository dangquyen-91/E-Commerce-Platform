"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import { reportService } from "@/lib/services/report.service";

const PERIOD_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

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

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("vi-VN").format(value);
};

type ViewMode = "week" | "month" | "year";

interface PeriodData {
  name: string;
  revenue: number;
  orderCount: number;
  color: string;
}

// Generate options
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => currentYear - i);
};

const getMonthOptions = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: `Tháng ${i + 1}`,
  }));
};

export function RevenueChartSection() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [data, setData] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0 });

  const yearOptions = getYearOptions();
  const monthOptions = getMonthOptions();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let startDate: Date;
        let endDate: Date;
        let granularity: "day" | "month";

        if (viewMode === "year") {
          // Whole year
          startDate = new Date(selectedYear, 0, 1);
          endDate = new Date(selectedYear, 11, 31);
          granularity = "month";
        } else if (viewMode === "month") {
          // Selected month
          startDate = new Date(selectedYear, selectedMonth, 1);
          endDate = new Date(selectedYear, selectedMonth + 1, 0);
          granularity = "day";
        } else {
          // Last 7 days
          endDate = new Date();
          startDate = new Date();
          startDate.setDate(endDate.getDate() - 6);
          granularity = "day";
        }

        // Gọi API 1 lần - chỉ lấy đơn Paid + Completed
        const res = await reportService.getSellerRevenueTrends({
          startDate: startDate.toISOString().split("T")[0],
          endDate: endDate.toISOString().split("T")[0],
          granularity,
        });

        let periodData: PeriodData[] = [];
        let totalRevenue = 0;
        let totalOrders = 0;

        if (res.success && res.data?.data) {
          if (viewMode === "year") {
            // Group by month
            res.data.data.forEach((item) => {
              const revenue = item.sales || 0;
              const orders = item.orderCount || 0;
              totalRevenue += revenue;
              totalOrders += orders;

              if (revenue > 0 || orders > 0) {
                const monthNum = item.date?.month || 1;
                periodData.push({
                  name: `T${monthNum}`,
                  revenue,
                  orderCount: orders,
                  color: PERIOD_COLORS[(monthNum - 1) % PERIOD_COLORS.length],
                });
              }
            });
          } else if (viewMode === "month") {
            // Group by week
            const weekMap = new Map<number, { revenue: number; orders: number }>();

            res.data.data.forEach((item) => {
              const day = item.date?.day || 1;
              const weekNum = Math.ceil(day / 7);
              const existing = weekMap.get(weekNum) || { revenue: 0, orders: 0 };
              weekMap.set(weekNum, {
                revenue: existing.revenue + (item.sales || 0),
                orders: existing.orders + (item.orderCount || 0),
              });
            });

            weekMap.forEach((value, weekNum) => {
              totalRevenue += value.revenue;
              totalOrders += value.orders;

              if (value.revenue > 0 || value.orders > 0) {
                periodData.push({
                  name: `Tuần ${weekNum}`,
                  revenue: value.revenue,
                  orderCount: value.orders,
                  color: PERIOD_COLORS[(weekNum - 1) % PERIOD_COLORS.length],
                });
              }
            });

            // Sort by week number
            periodData.sort((a, b) => {
              const weekA = parseInt(a.name.replace("Tuần ", ""));
              const weekB = parseInt(b.name.replace("Tuần ", ""));
              return weekA - weekB;
            });
          } else {
            // Week view - show by day
            res.data.data.forEach((item, index) => {
              const revenue = item.sales || 0;
              const orders = item.orderCount || 0;
              totalRevenue += revenue;
              totalOrders += orders;

              if (revenue > 0 || orders > 0) {
                const date = new Date(
                  item.date?.year || new Date().getFullYear(),
                  (item.date?.month || 1) - 1,
                  item.date?.day || 1
                );
                const dayName = date.toLocaleDateString("vi-VN", { weekday: "short" });
                periodData.push({
                  name: dayName,
                  revenue,
                  orderCount: orders,
                  color: PERIOD_COLORS[index % PERIOD_COLORS.length],
                });
              }
            });
          }
        }

        setData(periodData);
        setTotals({ revenue: totalRevenue, orders: totalOrders });
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewMode, selectedYear, selectedMonth]);

  const renderPieChart = (
    dataKey: "revenue" | "orderCount",
    title: string,
    formatter: (value: number) => string
  ) => {
    const chartData = data.map((d) => ({
      name: d.name,
      value: d[dataKey],
      color: d.color,
    })).filter((d) => d.value > 0);

    if (chartData.length === 0) {
      return (
        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-2">{title}</p>
          <div className="h-[100px] flex items-center justify-center text-muted-foreground text-xs">
            Chưa có dữ liệu
          </div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">{title}</p>
        <div className="h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatter(Number(value))}
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 11 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Thống kê theo thời gian
          </CardTitle>
        </div>

        {/* View Mode Buttons */}
        <div className="flex gap-1 mt-2 flex-wrap">
          <Button
            variant={viewMode === "week" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("week")}
          >
            7 ngày
          </Button>
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("month")}
          >
            Tháng
          </Button>
          <Button
            variant={viewMode === "year" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("year")}
          >
            Năm
          </Button>
        </div>

        {/* Date Selectors */}
        {(viewMode === "month" || viewMode === "year") && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[80px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {viewMode === "month" && (
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[90px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground gap-2">
            <p className="text-sm">Chưa có dữ liệu trong khoảng thời gian này</p>
            <p className="text-xs">Thử chọn khoảng thời gian khác</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                <p className="text-lg font-bold text-green-600">{formatPrice(totals.revenue)}đ</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-muted-foreground">Tổng đơn hàng</p>
                <p className="text-lg font-bold text-blue-600">{formatNumber(totals.orders)}</p>
              </div>
            </div>

            {/* Pie Charts */}
            <div className="grid grid-cols-2 gap-3">
              {renderPieChart("revenue", "Phân bổ doanh thu", (v) => formatPrice(v) + "đ")}
              {renderPieChart("orderCount", "Phân bổ đơn hàng", (v) => formatNumber(v) + " đơn")}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-2 text-[10px]">
              {data.map((d) => (
                <div key={d.name} className="flex items-center gap-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: d.color }}
                  />
                  <span>{d.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
