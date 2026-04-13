"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Trash2, Minus, Plus, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/RequireAuth";

// Types for backend data
interface CartItem {
  id: string;
  productId: string;
  title: string;
  platform: string;
  packageType: string;
  duration: string;
  price: number;
  quantity: number;
  inStock: boolean;
  sellerName: string;
}

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      try {
        // TODO: Fetch from backend
        // const cartData = await cartService.getCart();
        // setItems(cartData.items);
      } catch (error) {
        console.error("Failed to fetch cart:", error);
        toast.error("Không thể tải giỏ hàng");
      } finally {
        setIsLoading(false);
      }
    };
    fetchCart();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
      return;
    }
    try {
      // TODO: Call backend API
      // await cartService.updateQuantity(itemId, newQuantity);
      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      );
      toast.success("Đã cập nhật số lượng");
    } catch (error) {
      console.error("Failed to update quantity:", error);
      toast.error("Không thể cập nhật số lượng");
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      // TODO: Call backend API
      // await cartService.removeItem(itemId);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      toast.success("Đã xóa khỏi giỏ hàng");
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const clearCart = async () => {
    try {
      // TODO: Call backend API
      // await cartService.clearCart();
      setItems([]);
      toast.success("Đã xóa tất cả");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast.error("Không thể xóa giỏ hàng");
    }
  };

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const total = subtotal;

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Giỏ hàng trống");
      return;
    }
    router.push("/checkout");
  };

  return (
    <RequireAuth>
      {isLoading ? (
        <div className="container py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="container py-8">
          <h1 className="text-3xl font-bold mb-6">Giỏ hàng</h1>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Giỏ hàng trống</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Bạn chưa có sản phẩm nào trong giỏ hàng. Hãy thêm sản phẩm để tiếp tục mua sắm.
              </p>
              <Button onClick={() => router.push("/products")} variant="default">
                Xem danh mục
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="container py-6 md:py-8">
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Giỏ hàng ({items.length})</h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                >
                  Xóa tất cả
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        {/* Product Info */}
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2 flex-wrap items-start">
                            <Badge variant="secondary">{item.platform}</Badge>
                            <Badge variant="outline">{item.packageType}</Badge>
                            <Badge variant="outline">{item.duration}</Badge>
                          </div>
                          <Link
                            href={`/products/${item.productId}`}
                            className="block"
                          >
                            <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                              {item.title}
                            </h3>
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Seller: {item.sellerName}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-primary">
                              {formatPrice(item.price)}
                            </span>
                            {!item.inStock && (
                              <Badge variant="secondary">Hết hàng</Badge>
                            )}
                          </div>
                        </div>

                        {/* Quantity & Actions */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                          {/* Quantity Selector */}
                          <div className="flex items-center gap-2 border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity - 1)
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.id, item.quantity + 1)
                              }
                              disabled={!item.inStock}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Price & Remove */}
                          <div className="flex flex-col items-end gap-2">
                            <p className="text-xl font-bold">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <Card>
                <CardHeader>
                  <CardTitle>Tóm tắt đơn hàng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tạm tính:</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Tổng cộng:</span>
                      <span className="text-primary text-xl">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>

                  <Alert variant="info">
                    <AlertIcon.info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Tiền được giữ trong Escrow đến khi bạn xác nhận nhận hàng thành công
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={items.some((item) => !item.inStock)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Thanh toán ({items.length})
                  </Button>

                  {items.some((item) => !item.inStock) && (
                    <Alert variant="warning">
                      <AlertIcon.warning className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Một số sản phẩm đã hết hàng. Vui lòng xóa khỏi giỏ hàng để tiếp tục.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/products">Tiếp tục mua sắm</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </RequireAuth>
  );
}
