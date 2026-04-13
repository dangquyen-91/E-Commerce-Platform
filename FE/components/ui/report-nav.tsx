"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  AlertCircle,
  LayoutDashboard 
} from "lucide-react";

interface ReportNavProps {
  isAdmin?: boolean;
}

export function ReportNav({ isAdmin = true }: ReportNavProps) {
  const pathname = usePathname();
  
  const adminLinks = [
    { href: "/admin/reports", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/admin/reports/revenue", label: "Doanh thu", icon: TrendingUp },
    { href: "/admin/reports/orders", label: "Đơn hàng", icon: Package },
    { href: "/admin/reports/complaints", label: "Khiếu nại", icon: AlertCircle },
  ];

  const sellerLinks = [
    { href: "/seller/reports", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/seller/reports/revenue", label: "Doanh thu", icon: TrendingUp },
    { href: "/seller/reports/orders", label: "Đơn hàng", icon: Package },
  ];

  const links = isAdmin ? adminLinks : sellerLinks;

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit border">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;
        
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
              isActive 
                ? "bg-background text-primary shadow-sm" 
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
