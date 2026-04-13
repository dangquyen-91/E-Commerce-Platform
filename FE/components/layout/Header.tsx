"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/auth";
import { authService } from "@/lib/services/auth.service";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/hooks/useShop";
import {
  Search,
  User,
  LogOut,
  Store,
  Shield,
  Menu,
  X,
  Wallet,
  Package,
  Layers,
  Users,
  ShoppingBag,
  ChevronDown,
  Sparkles,
  FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { MessageNotification } from "@/components/chat";

export function Header() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { hasActiveShop, shop } = useShop();

  const handleLogout = async () => {
    await authService.logout();
    router.push("/");
  };

  const navLinks = [
    { href: "/products", label: "Sản phẩm", icon: Package },
    { href: "/categories", label: "Danh mục", icon: Layers },
    { href: "/sellers", label: "Người bán", icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      {/* Top bar - Trust indicators */}
      <div className="hidden md:block bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 py-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-green-600" />
              <span>Giao dịch an toàn</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Người bán uy tín</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6 lg:gap-8 shrink-0">
            <Link
              href="/"
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <span className="font-bold text-lg bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Sàn Tài Khoản Số
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground rounded-lg transition-all hover:text-foreground hover:bg-accent"
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <form
              action="/products"
              method="get"
              className="relative w-full"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get("search") as string;
                if (query) {
                  window.location.href = `/products?search=${encodeURIComponent(query)}`;
                } else {
                  window.location.href = `/products`;
                }
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                name="search"
                placeholder="Tìm kiếm nền tảng, loại gói..."
                className="pl-10 h-10 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-background"
                autoComplete="off"
              />
            </form>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            {isAuthenticated && <MessageNotification />}
            {isLoading ? (
              // Skeleton while loading auth state
              <div className="h-9 w-24 bg-muted animate-pulse rounded-lg" />
            ) : !isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:flex h-9 px-4"
                  asChild
                >
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button
                  size="sm"
                  className="hidden sm:flex h-9 px-4 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
                  asChild
                >
                  <Link href="/register">Đăng ký</Link>
                </Button>
                {/* Mobile Auth */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden h-9 w-9"
                  asChild
                >
                  <Link href="/login">
                    <User className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 gap-2 pl-2 pr-3 rounded-full hover:bg-accent"
                  >
                    <Avatar className="h-7 w-7 border-2 border-primary/20">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-semibold">
                        {user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                      {user?.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={user?.role === "seller" ? "/seller/profile" : "/customer/profile"}
                      className="flex items-center"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>Hồ sơ</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/wallet" className="flex items-center">
                      <Wallet className="mr-2 h-4 w-4" />
                      <span>Ví tiền</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/orders" className="flex items-center">
                      <Package className="mr-2 h-4 w-4" />
                      <span>Lịch sử đơn hàng</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/customer/complaints" className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Lịch sử khiếu nại</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Seller Options */}
                  {user?.role === "customer" && !shop && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller/register" className="flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Đăng ký bán hàng</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {shop && shop.status === "Pending" && (
                    <DropdownMenuItem asChild>
                      <Link href="/customer/seller-application-status" className="flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Trạng thái đơn đăng ký</span>
                        <Badge variant="secondary" className="ml-auto text-xs">
                          Chờ duyệt
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {hasActiveShop && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller" className="flex items-center">
                        <Store className="mr-2 h-4 w-4 text-green-600" />
                        <span>Shop của tôi</span>
                        <Badge variant="default" className="ml-auto text-xs bg-green-600">
                          Active
                        </Badge>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {shop && shop.status === "Closed" && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller/register?reregister=true" className="flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Đăng ký lại bán hàng</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user?.role === "seller" && !hasActiveShop && !shop && (
                    <DropdownMenuItem asChild>
                      <Link href="/seller/register" className="flex items-center">
                        <Store className="mr-2 h-4 w-4" />
                        <span>Tạo Shop</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {/* Moderator Options */}
                  {user?.role === "moderator" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/moderator/shops" className="flex items-center">
                          <Store className="mr-2 h-4 w-4" />
                          <span>Quản lý Shop</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/moderator/review" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Kiểm duyệt sản phẩm</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {/* Admin Options */}
                  {user?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          <span>Quản trị</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t py-4 space-y-4">
            {/* Mobile Search */}
            <form
              action="/products"
              method="get"
              className="relative"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const query = formData.get("search") as string;
                if (query) {
                  window.location.href = `/products?search=${encodeURIComponent(query)}`;
                } else {
                  window.location.href = `/products`;
                }
                setMobileMenuOpen(false);
              }}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                name="search"
                placeholder="Tìm kiếm nền tảng, loại gói..."
                className="pl-10 h-11 bg-muted/50"
                autoComplete="off"
              />
            </form>

            {/* Mobile Navigation */}
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg transition-colors hover:bg-accent"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <link.icon className="h-5 w-5 text-muted-foreground" />
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Auth */}
            {!isLoading && !isAuthenticated && (
              <>
                <div className="border-t pt-4 space-y-2">
                  <Button variant="outline" className="w-full h-11" asChild>
                    <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button className="w-full h-11 bg-gradient-to-r from-primary to-primary/90" asChild>
                    <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                      Đăng ký miễn phí
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
