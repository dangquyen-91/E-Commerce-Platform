"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  FileText,
  Store,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface ModeratorStats {
  pendingComplaints: number;
  resolvedToday: number;
  pendingShops: number;
  suspendedShops: number;
}

export default function ModeratorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ModeratorStats>({
    pendingComplaints: 0,
    resolvedToday: 0,
    pendingShops: 0,
    suspendedShops: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch real stats from backend
        // const response = await moderatorService.getStats();
        // setStats(response);
      } catch (error) {
        console.error("Failed to fetch moderator data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Dashboard Moderator
        </h1>
        <p className="text-sm text-muted-foreground">
          Xử lý khiếu nại và quản lý shop
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Khiếu nại chờ xử lý
            </CardTitle>
            <Clock className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.pendingComplaints}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Link
                    href="/moderator/complaints"
                    className="text-primary hover:underline"
                  >
                    Xem danh sách
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đã xử lý hôm nay
            </CardTitle>
            <CheckCircle className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats.resolvedToday}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Khiếu nại đã giải quyết
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shop chờ duyệt
            </CardTitle>
            <Store className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.pendingShops}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  <Link
                    href="/moderator/shops"
                    className="text-primary hover:underline"
                  >
                    Xem danh sách
                  </Link>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Shop bị tạm ngưng
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold text-red-600">
                  {stats.suspendedShops}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Đang bị khóa
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thao tác nhanh</CardTitle>
          <CardDescription className="text-xs">
            Các chức năng chính của moderator
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              asChild
            >
              <Link href="/moderator/complaints">
                <FileText className="h-8 w-8 text-primary" />
                <span className="font-medium">Xử lý khiếu nại</span>
                <span className="text-xs text-muted-foreground">
                  Giải quyết tranh chấp giữa buyer và seller
                </span>
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-6 flex-col gap-2"
              asChild
            >
              <Link href="/moderator/shops">
                <Store className="h-8 w-8 text-primary" />
                <span className="font-medium">Quản lý shop</span>
                <span className="text-xs text-muted-foreground">
                  Duyệt, khóa hoặc mở khóa shop
                </span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">Vai trò Moderator</p>
              <p className="text-sm text-blue-700 mt-1">
                Bạn có quyền xử lý khiếu nại từ người mua và quản lý trạng thái
                các shop trên hệ thống. Hãy xử lý công bằng và tuân thủ quy định.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
