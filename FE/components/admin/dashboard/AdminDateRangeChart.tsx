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

const PERIOD_COLORS = ["#8b5cf6", "#06b6d4", "#f43f5e", "#84cc16", "#f97316", "#ec4899"];

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

type ViewMode = "day" | "month" | "year";

interface PeriodData {
  name: string;
  revenue: number;
  orderCount: number;
  totalFees: number;
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

const getDayOptions = (year: number, month: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => i + 1);
};

export function AdminDateRangeChart() {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [data, setData] = useState<PeriodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, fees: 0 });

  const yearOptions = getYearOptions();
  const monthOptions = getMonthOptions();
  const dayOptions = getDayOptions(selectedYear, selectedMonth);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        let periodData: PeriodData[] = [];
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalFees = 0;

        if (viewMode === "year") {
          // Show 12 months of selected year
          const months = Array.from({ length: 12 }, (_, i) => i);

          for (let i = 0; i < months.length; i++) {
            const startDate = new Date(selectedYear, i, 1);
            const endDate = new Date(selectedYear, i + 1, 0);

            // Skip future months
            if (startDate > new Date()) continue;

            try {
              const res = await reportService.getRevenueTrends({
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate.toISOString().split("T")[0],
                granularity: "month",
              });

              if (res.success && res.data) {
                const summary = res.data.summary;
                const fees = res.data.data.reduce((sum, item) => sum + (item.totalFees || 0), 0);

                totalRevenue += summary.totalRevenue;
                totalOrders += summary.totalOrders;
                totalFees += fees;

                if (summary.totalRevenue > 0 || summary.totalOrders > 0) {
                  periodData.push({
                    name: `T${i + 1}`,
                    revenue: summary.totalRevenue,
                    orderCount: summary.totalOrders,
                    totalFees: fees,
                    color: PERIOD_COLORS[i % PERIOD_COLORS.length],
                  });
                }
              }
            } catch {
              // Skip failed months
            }
          }
        } else if (viewMode === "month") {
          // Show weeks of selected month
          const startOfMonth = new Date(selectedYear, selectedMonth, 1);
          const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0);
          const daysInMonth = endOfMonth.getDate();

          // Split into weeks
          const weeks: { start: number; end: number; label: string }[] = [];
          let weekStart = 1;
          let weekNum = 1;

          while (weekStart <= daysInMonth) {
            const weekEnd = Math.min(weekStart + 6, daysInMonth);
            weeks.push({
              start: weekStart,
              end: weekEnd,
              label: `Tuần ${weekNum}`,
            });
            weekStart = weekEnd + 1;
            weekNum++;
          }

          for (let i = 0; i < weeks.length; i++) {
            const week = weeks[i];
            const startDate = new Date(selectedYear, selectedMonth, week.start);
            const endDate = new Date(selectedYear, selectedMonth, week.end);

            // Skip future weeks
            if (startDate > new Date()) continue;

            try {
              const res = await reportService.getRevenueTrends({
                startDate: startDate.toISOString().split("T")[0],
                endDate: endDate.toISOString().split("T")[0],
                granularity: "day",
              });

              if (res.success && res.data) {
                const summary = res.data.summary;
                const fees = res.data.data.reduce((sum, item) => sum + (item.totalFees || 0), 0);

                totalRevenue += summary.totalRevenue;
                totalOrders += summary.totalOrders;
                totalFees += fees;

                if (summary.totalRevenue > 0 || summary.totalOrders > 0) {
                  periodData.push({
                    name: week.label,
                    revenue: summary.totalRevenue,
                    orderCount: summary.totalOrders,
                    totalFees: fees,
                    color: PERIOD_COLORS[i % PERIOD_COLORS.length],
                  });
                }
              }
            } catch {
              // Skip failed weeks
            }
          }
        } else {
          // Day view - show hourly breakdown (morning, afternoon, evening, night)
          const targetDate = new Date(selectedYear, selectedMonth, selectedDay);

          // Skip future dates
          if (targetDate <= new Date()) {
            const dateStr = targetDate.toISOString().split("T")[0];

            try {
              const res = await reportService.getRevenueTrends({
                startDate: dateStr,
                endDate: dateStr,
                granularity: "day",
              });

              if (res.success && res.data && res.data.summary) {
                const summary = res.data.summary;
                const fees = res.data.data.reduce((sum, item) => sum + (item.totalFees || 0), 0);

                totalRevenue = summary.totalRevenue;
                totalOrders = summary.totalOrders;
                totalFees = fees;

                // For single day, show as single entry
                if (summary.totalRevenue > 0 || summary.totalOrders > 0) {
                  periodData.push({
                    name: `${selectedDay}/${selectedMonth + 1}`,
                    revenue: summary.totalRevenue,
                    orderCount: summary.totalOrders,
                    totalFees: fees,
                    color: PERIOD_COLORS[0],
                  });
                }
              }
            } catch {
              // Skip failed
            }
          }
        }

        setData(periodData);
        setTotals({ revenue: totalRevenue, orders: totalOrders, fees: totalFees });
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewMode, selectedYear, selectedMonth, selectedDay]);

  const renderPieChart = (
    dataKey: "revenue" | "orderCount" | "totalFees",
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
        <div className="flex gap-1 mt-2">
          <Button
            variant={viewMode === "day" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("day")}
          >
            Ngày
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

          {(viewMode === "month" || viewMode === "day") && (
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

          {viewMode === "day" && (
            <Select
              value={selectedDay.toString()}
              onValueChange={(v) => setSelectedDay(parseInt(v))}
            >
              <SelectTrigger className="w-[70px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOptions.map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Ngày {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <Skeleton className="h-[200px] w-full" />
        ) : data.length === 0 ? (
          <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
            Chưa có dữ liệu trong khoảng thời gian này
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-purple-50 rounded-lg">
                <p className="text-[10px] text-muted-foreground">Doanh thu</p>
                <p className="text-sm font-bold text-purple-600">{formatPrice(totals.revenue)}đ</p>
              </div>
              <div className="p-2 bg-cyan-50 rounded-lg">
                <p className="text-[10px] text-muted-foreground">Đơn hàng</p>
                <p className="text-sm font-bold text-cyan-600">{formatNumber(totals.orders)}</p>
              </div>
              <div className="p-2 bg-pink-50 rounded-lg">
                <p className="text-[10px] text-muted-foreground">Phí sàn</p>
                <p className="text-sm font-bold text-pink-600">{formatPrice(totals.fees)}đ</p>
              </div>
            </div>

            {/* Pie Charts */}
            <div className="grid grid-cols-3 gap-2">
              {renderPieChart("revenue", "Doanh thu", (v) => formatPrice(v) + "đ")}
              {renderPieChart("orderCount", "Đơn hàng", (v) => formatNumber(v) + " đơn")}
              {renderPieChart("totalFees", "Phí sàn", (v) => formatPrice(v) + "đ")}
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
