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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { reportService } from "@/lib/services/report.service";

const QUARTER_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

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

interface QuarterData {
  name: string;
  revenue: number;
  orderCount: number;
  totalFees: number;
  avgOrderValue: number;
  color: string;
}

interface ComparisonData {
  revenueChange: number | null;
  orderChange: number | null;
  feeChange: number | null;
}

function MiniPieChart({
  data,
  dataKey,
  title,
  formatter
}: {
  data: QuarterData[];
  dataKey: "revenue" | "orderCount" | "totalFees";
  title: string;
  formatter: (value: number) => string;
}) {
  const chartData = data.map(q => ({
    name: q.name,
    value: q[dataKey],
    color: q.color,
  })).filter(d => d.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="text-center">
        <p className="text-xs text-muted-foreground mb-2">{title}</p>
        <div className="h-[120px] flex items-center justify-center text-muted-foreground text-xs">
          Chưa có dữ liệu
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-2">{title}</p>
      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={50}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatter(Number(value))}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ComparisonBadge({
  label,
  change
}: {
  label: string;
  change: number | null;
}) {
  if (change === null) {
    return (
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span>{label}: N/A</span>
      </div>
    );
  }

  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className={`flex items-center gap-1 text-xs ${
      isPositive ? "text-green-600" : isNegative ? "text-red-600" : "text-muted-foreground"
    }`}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3" />
      ) : isNegative ? (
        <TrendingDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )}
      <span>{label}: {isPositive ? "+" : ""}{change.toFixed(1)}%</span>
    </div>
  );
}

// Generate year options (current year and 4 years back)
const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = 0; i < 5; i++) {
    years.push(currentYear - i);
  }
  return years;
};

export function AdminRevenueChart() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<QuarterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ revenue: 0, orders: 0, fees: 0 });
  const [comparison, setComparison] = useState<ComparisonData>({
    revenueChange: null,
    orderChange: null,
    feeChange: null,
  });

  const yearOptions = getYearOptions();

  useEffect(() => {
    async function fetchQuarterlyData() {
      setLoading(true);
      try {
        const currentYear = selectedYear;
        const now = new Date();
        const isCurrentYear = selectedYear === now.getFullYear();
        const currentMonth = now.getMonth();
        const currentQuarterIndex = isCurrentYear ? Math.floor(currentMonth / 3) : 3;

        const quarters = [
          { name: "Q1", startMonth: 0, endMonth: 2 },
          { name: "Q2", startMonth: 3, endMonth: 5 },
          { name: "Q3", startMonth: 6, endMonth: 8 },
          { name: "Q4", startMonth: 9, endMonth: 11 },
        ];

        const quarterlyData: QuarterData[] = [];
        let totalRevenue = 0;
        let totalOrders = 0;
        let totalFees = 0;

        for (let i = 0; i < quarters.length; i++) {
          const q = quarters[i];
          const startDate = new Date(currentYear, q.startMonth, 1);
          const endDate = new Date(currentYear, q.endMonth + 1, 0);

          // Skip future quarters (only for current year)
          if (isCurrentYear && startDate > now) {
            quarterlyData.push({
              name: q.name,
              revenue: 0,
              orderCount: 0,
              totalFees: 0,
              avgOrderValue: 0,
              color: QUARTER_COLORS[i],
            });
            continue;
          }

          try {
            const res = await reportService.getRevenueTrends({
              startDate: startDate.toISOString().split("T")[0],
              endDate: endDate.toISOString().split("T")[0],
              granularity: "month",
            });

            if (res.success && res.data) {
              const summary = res.data.summary;
              const dataItems = res.data.data;

              // Sum up totalFees from data items
              const fees = dataItems.reduce((sum, item) => sum + (item.totalFees || 0), 0);

              totalRevenue += summary.totalRevenue;
              totalOrders += summary.totalOrders;
              totalFees += fees;

              quarterlyData.push({
                name: q.name,
                revenue: summary.totalRevenue,
                orderCount: summary.totalOrders,
                totalFees: fees,
                avgOrderValue: summary.avgOrderValue,
                color: QUARTER_COLORS[i],
              });
            } else {
              quarterlyData.push({
                name: q.name,
                revenue: 0,
                orderCount: 0,
                totalFees: 0,
                avgOrderValue: 0,
                color: QUARTER_COLORS[i],
              });
            }
          } catch {
            quarterlyData.push({
              name: q.name,
              revenue: 0,
              orderCount: 0,
              totalFees: 0,
              avgOrderValue: 0,
              color: QUARTER_COLORS[i],
            });
          }
        }

        setData(quarterlyData);
        setTotals({ revenue: totalRevenue, orders: totalOrders, fees: totalFees });

        // Calculate comparison with previous quarter
        if (currentQuarterIndex > 0) {
          const current = quarterlyData[currentQuarterIndex];
          const previous = quarterlyData[currentQuarterIndex - 1];

          if (current && previous && previous.revenue > 0) {
            setComparison({
              revenueChange: ((current.revenue - previous.revenue) / previous.revenue) * 100,
              orderChange: previous.orderCount > 0
                ? ((current.orderCount - previous.orderCount) / previous.orderCount) * 100
                : null,
              feeChange: previous.totalFees > 0
                ? ((current.totalFees - previous.totalFees) / previous.totalFees) * 100
                : null,
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch quarterly data", err);
      } finally {
        setLoading(false);
      }
    }

    fetchQuarterlyData();
  }, [selectedYear]);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Thống kê theo quý</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some(q => q.revenue > 0 || q.orderCount > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Thống kê theo quý
          </CardTitle>
          <div className="flex items-center gap-3">
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              Tổng: {formatPrice(totals.revenue)}đ
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">
            Chưa có dữ liệu thống kê
          </div>
        ) : (
          <>
            {/* 3 Pie Charts */}
            <div className="grid grid-cols-3 gap-4">
              <MiniPieChart
                data={data}
                dataKey="revenue"
                title="Doanh thu"
                formatter={(v) => formatPrice(v) + "đ"}
              />
              <MiniPieChart
                data={data}
                dataKey="orderCount"
                title="Đơn hàng"
                formatter={(v) => formatNumber(v) + " đơn"}
              />
              <MiniPieChart
                data={data}
                dataKey="totalFees"
                title="Phí sàn"
                formatter={(v) => formatPrice(v) + "đ"}
              />
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-4 text-xs">
              {data.filter(q => q.revenue > 0 || q.orderCount > 0).map((q) => (
                <div key={q.name} className="flex items-center gap-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: q.color }}
                  />
                  <span>{q.name}</span>
                </div>
              ))}
            </div>

            {/* Comparison with previous quarter */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                So sánh với quý trước:
              </p>
              <div className="flex flex-wrap gap-4">
                <ComparisonBadge label="Doanh thu" change={comparison.revenueChange} />
                <ComparisonBadge label="Đơn hàng" change={comparison.orderChange} />
                <ComparisonBadge label="Phí sàn" change={comparison.feeChange} />
              </div>
            </div>

            {/* Detail Table */}
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Chi tiết từng quý:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 font-medium">Quý</th>
                      <th className="text-right py-2 font-medium">Doanh thu</th>
                      <th className="text-right py-2 font-medium">Đơn hàng</th>
                      <th className="text-right py-2 font-medium">Phí sàn</th>
                      <th className="text-right py-2 font-medium">TB/đơn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.filter(q => q.revenue > 0 || q.orderCount > 0).map((q) => (
                      <tr key={q.name} className="border-b last:border-0">
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: q.color }}
                            />
                            {q.name}
                          </div>
                        </td>
                        <td className="text-right py-2 font-medium">
                          {formatPrice(q.revenue)}đ
                        </td>
                        <td className="text-right py-2">
                          {formatNumber(q.orderCount)}
                        </td>
                        <td className="text-right py-2">
                          {formatPrice(q.totalFees)}đ
                        </td>
                        <td className="text-right py-2">
                          {formatPrice(q.avgOrderValue)}đ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="font-medium bg-muted/50">
                      <td className="py-2">Tổng</td>
                      <td className="text-right py-2">{formatPrice(totals.revenue)}đ</td>
                      <td className="text-right py-2">{formatNumber(totals.orders)}</td>
                      <td className="text-right py-2">{formatPrice(totals.fees)}đ</td>
                      <td className="text-right py-2">-</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
