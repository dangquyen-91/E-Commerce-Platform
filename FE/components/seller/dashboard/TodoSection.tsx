"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Star, Clock, AlertTriangle } from "lucide-react";
import { TodoItems } from "./useSellerDashboard";

interface TodoSectionProps {
  todoItems: TodoItems;
}

const todoConfig = [
  {
    key: "pendingDelivery" as const,
    label: "Đơn chờ giao",
    icon: Package,
    href: "/seller/orders?status=pending",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    key: "unrepliedReviews" as const,
    label: "Đánh giá chưa phản hồi",
    icon: Star,
    href: "/seller/reviews",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50",
  },
  {
    key: "pendingProducts" as const,
    label: "SP chờ duyệt",
    icon: Clock,
    href: "/seller/products?status=pending",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    key: "lowInventory" as const,
    label: "Inventory thấp",
    icon: AlertTriangle,
    href: "/seller/inventory",
    color: "text-red-500",
    bgColor: "bg-red-50",
  },
];

export function TodoSection({ todoItems }: TodoSectionProps) {
  const activeTodos = todoConfig.filter((item) => todoItems[item.key] > 0);

  if (activeTodos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Việc cần làm</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activeTodos.map((item) => {
            const Icon = item.icon;
            const count = todoItems[item.key];

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`flex flex-col items-center justify-center p-4 rounded-lg ${item.bgColor} hover:opacity-80 transition-opacity`}
              >
                <Icon className={`h-6 w-6 ${item.color} mb-2`} />
                <span className="text-2xl font-bold text-gray-900">{count}</span>
                <span className="text-xs text-gray-600 text-center mt-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
