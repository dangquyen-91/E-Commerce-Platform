"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reportService } from "@/lib/services/report.service";
import { ModeratorPerformanceResponse } from "@/types/report";
import { ReportNav } from "@/components/ui/report-nav";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  TrendingUp,
  Mail,
  Zap
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminComplaintsPage() {
  const [data, setData] = useState<ModeratorPerformanceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await reportService.getModeratorPerformance({});
        if (res.success) setData(res.data || null);
      } catch (error) {
        console.error("Failed to fetch moderator performance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading && !data) return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 bg-white">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Không thể tải dữ liệu báo cáo khiếu nại</h2>
      <p className="text-muted-foreground">Vui lòng thử lại sau.</p>
    </div>
  );

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 bg-white min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/admin/reports" className="hover:text-primary transition-colors">Báo cáo</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Khiếu nại</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Hiệu suất xử lý khiếu nại</h2>
        </div>
        <ReportNav isAdmin={true} />
      </div>

      {/* Summary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-md bg-gradient-to-br from-slate-800 to-slate-900 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-300 uppercase tracking-wider">Đội ngũ Moderator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalModerators} nhân viên</div>
            <div className="mt-1 flex items-center text-[10px] text-slate-400 italic">
              Đang hoạt động trên hệ thống
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-gradient-to-br from-indigo-600 to-indigo-700 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Tổng khiếu nại đã xử lý</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalTicketsResolved} tickets</div>
            <div className="mt-1 flex items-center text-[10px] text-indigo-100 italic">
              <TrendingUp className="mr-1 h-3 w-3" /> Tỷ lệ hoàn thành: {data.summary.avgResolutionRate}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white border border-slate-100 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-3 text-emerald-50 opacity-50 group-hover:opacity-80 transition-opacity">
            <Zap className="h-12 w-12 text-emerald-100" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tỷ lệ SLA trung bình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {Math.round(data.moderators.reduce((acc, m) => acc + m.slaComplianceRate, 0) / (data.moderators.length || 1))}%
            </div>
            <div className="mt-1 text-[10px] text-slate-400 italic">Cam kết chất lượng phục vụ</div>
          </CardContent>
        </Card>
      </div>

      {/* Moderator Performance Table */}
      <Card className="border-none shadow-md bg-white overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2 text-slate-800">
            <ShieldCheck className="h-5 w-5 text-indigo-500" />
            Chi tiết hiệu suất nhân sự
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/30">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-500 uppercase py-4">Nhân viên</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Giao việc</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Hoàn thành</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Tỷ lệ %</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">SLA %</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Xử lý TB (phút)</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-500 uppercase">Vi phạm SLA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.moderators.map((m) => (
                <TableRow key={m.moderatorId} className="hover:bg-slate-50/80 transition-colors border-b-slate-100">
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-slate-700">{m.moderatorName}</span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Mail className="h-2.5 w-2.5" /> {m.moderatorEmail}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-600">{m.totalAssigned}</TableCell>
                  <TableCell className="text-right font-bold text-slate-900">{m.totalResolved}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={m.resolutionRate >= 80 ? "default" : "destructive"} className="px-2 py-0 text-[10px]">
                      {m.resolutionRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={m.slaComplianceRate >= 90 ? "outline" : "secondary"} className={
                      m.slaComplianceRate >= 90 ? "border-emerald-500 text-emerald-600" : "bg-slate-100 text-slate-500"
                    }>
                      {m.slaComplianceRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-700">
                    <div className="flex items-center justify-end gap-1.5">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {m.avgResolutionTimeMinutes}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={cn(
                      "font-bold",
                      m.slaBreaches > 0 ? "text-red-500" : "text-emerald-500"
                    )}>
                      {m.slaBreaches}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="p-4 bg-slate-50/30 border-t text-xs text-slate-400 italic flex items-center gap-2">
             <AlertCircle className="h-3 w-3 text-amber-500" />
             Dữ liệu được cập nhật dựa trên hoạt động trong 30 ngày gần nhất.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
