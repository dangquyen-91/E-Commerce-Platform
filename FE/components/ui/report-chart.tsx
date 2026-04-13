"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateGroupKey } from "@/types/report";

interface ReportChartProps {
  data: any[];
  title: string;
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
}

export function ReportChart({ data, title, lines }: ReportChartProps) {
  const formatXAxis = (date: DateGroupKey) => {
    if (date.day) return `${date.day}/${date.month}`;
    if (date.week) return `W${date.week}/${date.year % 100}`;
    return `${date.month}/${date.year}`;
  };

  const chartData = data.map((item) => ({
    ...item,
    formattedDate: formatXAxis(item.date),
  }));

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="formattedDate" />
              <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} />
              <Tooltip 
                formatter={(value) =>
                  typeof value === "number"
                    ? new Intl.NumberFormat("vi-VN").format(value)
                    : value ?? ""
                }
                labelStyle={{ color: "black" }}
              />
              <Legend />
              {lines.map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
