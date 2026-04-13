"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertIcon } from "@/components/ui/alert";
import { useAuthStore } from "@/lib/auth";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Shield, Star, CheckCircle, Lock, Package, User, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { shopService } from "@/lib/services/shop.service";
import { reviewService } from "@/lib/services/review.service";
import { ProductReviews } from "@/components/reviews";
import { ChatWithShopButton } from "@/components/chat";

// Types for backend data
interface ProductShop {
  id: string;
  name: string;
  avatar: string | null;
  ownerId?: string; // ID của chủ shop để chặn self-chat
  rating: number;
  reviewCount: number;
  listingCount: number;
  soldCount: number;
  responseRate: number;
  joinedDate: string;
  isVerified: boolean;
  trustLevel: string;
  status: string;
}

interface Product {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  platform: string;
  planType: string;
  durationDays: number;
  durationLabel: string;
  price: number;
  description: string;
  warranty: string;
  howToUse: string;
  soldCount: number;
  inventoryCount: number;
  inStock: boolean;
  status: string;
  shopId: string;
  shop: ProductShop;
}

export default function ProductDetailPage() {
  const { id: productId } = useParams<{ id: string }>();
  const { isAuthenticated, user: currentUser } = useAuthStore();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        console.log("[ProductDetail] Fetching ID:", productId);
        const response = await productService.getProductById(productId);
        console.log("[ProductDetail] Response raw:", response);

        // BE có thể trả {success, data} hoặc trả thẳng data object tùy thuộc vào API client
        const productData = response.success ? response.data : (response as unknown as ProductResponse);

        if (productData && (productData._id || productData.id)) {
          console.log("[ProductDetail] Processing data:", productData);

          // Type for populated shop data from API
          type PopulatedShop = { _id?: string; id?: string; shopName?: string; ownerUserId?: any };

          // Get shopId - could be string or object
          const shopIdObj = productData.shopId as unknown as string | PopulatedShop;
          const shopId = typeof shopIdObj === "object"
            ? (shopIdObj._id || shopIdObj.id || "")
            : shopIdObj;

          // Fetch shop details, rating stats, and shop products count in parallel
          const [shopRes, ratingStats, shopProductsRes] = await Promise.all([
            shopId ? shopService.getShopById(shopId).catch(() => null) : Promise.resolve(null),
            reviewService.getProductRatingStats(productId).catch(() => null),
            shopId ? productService.getProducts({ shopId }).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          ]);
          
          // shopRes có thể là ApiResponse<Shop> hoặc Shop tùy theo implementation
          const shopData = (shopRes as any)?.success ? (shopRes as any).data : shopRes;
          const shopProductsCount = (shopProductsRes as any)?.data?.length || 0;

          // Extract shop info from populated shopId if available
          const populatedShop = typeof shopIdObj === "object" ? shopIdObj : null;
          
          // Lấy ownerId từ shopData (có thể là string hoặc object)
          const ownerId = typeof shopData?.ownerUserId === 'string' 
            ? shopData.ownerUserId 
            : shopData?.ownerUserId?._id || populatedShop?.ownerUserId?._id || populatedShop?.ownerUserId;

          const mappedProduct: Product = {
            id: (productData._id || productData.id) as string,
            title: productData.title,
            thumbnailUrl: productData.thumbnailUrl || null,
            platform: productData.platformId,
            planType: productData.planType,
            durationDays: productData.durationDays,
            durationLabel: `${productData.durationDays} ngày`,
            price: productData.price,
            description: productData.description,
            warranty: productData.warrantyPolicy,
            howToUse: productData.howToUse,
            soldCount: (productData as any).salesCount || 0,
            inventoryCount: 0,
            inStock: productData.status === "Approved",
            status: productData.status || "Approved",
            shopId: shopId,
            shop: {
              id: shopId,
              name: shopData?.shopName || populatedShop?.shopName || "Shop",
              avatar: null,
              ownerId: ownerId,
              rating: ratingStats?.averageRating || shopData?.ratingAvg || 0,
              reviewCount: ratingStats?.totalReviews || shopData?.reviewCount || 0,
              listingCount: shopProductsCount,
              soldCount: shopData?.totalSales || 0,
              responseRate: shopData?.responseRate || 0,
              joinedDate: shopData?.createdAt || "",
              isVerified: false,
              trustLevel: "Standard",
              status: shopData?.status === "Active" ? "active" : (shopData?.status?.toLowerCase() || "active"),
            },
          };

          setProduct(mappedProduct);
        } else {
          setProduct(null);
        }
      } catch (err: any) {
        console.error("[ProductDetail] fetchProduct error:", err);
        const msg =
          err instanceof Error
            ? err.message
            : typeof err?.message === "string"
              ? err.message
              : typeof err?.response?.data?.message === "string"
                ? err.response.data.message
                : "Không thể tải thông tin sản phẩm";
        toast.error(msg);
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${productId}`);
      return;
    }
    if (!product || !product.inStock) {
      toast.error("Sản phẩm đã hết hàng");
      return;
    }
    router.push(`/checkout?product=${productId}&quantity=${quantity}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <div className="grid lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-16 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không tìm thấy sản phẩm</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Sản phẩm này không tồn tại hoặc đã bị xóa.
            </p>
            <Button onClick={() => router.push("/products")} variant="default">
              Xem sản phẩm khác
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      <div className="grid lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Product Header */}
          <div className="space-y-5 md:space-y-6">
            {/* Thumbnail */}
            {product.thumbnailUrl && (
              <div className="w-full max-w-xl mx-auto rounded-2xl border bg-muted/40 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.thumbnailUrl}
                  alt={product.title}
                  className="w-full h-auto max-h-[320px] object-contain bg-background"
                />
              </div>
            )}

            {/* Platform & Badges */}
            <div className="flex gap-2 md:gap-3 flex-wrap items-center">
              <Badge variant="secondary" className="text-base px-3 py-1.5">{product.planType}</Badge>
              <Badge variant="outline" className="text-base px-3 py-1.5">{product.durationLabel}</Badge>
              {product.inStock ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-base px-3 py-1.5">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Còn hàng
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-base px-3 py-1.5">Hết hàng</Badge>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
              {product.title}
            </h1>

            {/* Stats */}
            <div className="flex items-center gap-3 md:gap-4 flex-wrap text-base">
              <span className="text-muted-foreground">
                Đã bán: <span className="font-semibold text-foreground">{product.soldCount.toLocaleString()}</span>
              </span>
              {product.inventoryCount > 0 && (
                <>
                  <Separator orientation="vertical" className="h-5" />
                  <span className="text-muted-foreground">
                    Còn lại: <span className="font-semibold text-foreground">{product.inventoryCount}</span> gói trong kho
                  </span>
                </>
              )}
              <Separator orientation="vertical" className="h-5" />
              <span className="text-muted-foreground">
                Thời hạn: <span className="font-semibold text-foreground">{product.durationLabel}</span> ({product.durationDays} ngày)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary">
                {formatPrice(product.price)}
              </span>
            </div>

            {/* Delivery Info */}
            <Alert variant="info" className="mt-4">
              <AlertIcon.info className="h-5 w-5" />
              <AlertDescription className="text-base">
                <strong>Giao hàng số tức thì</strong> - Nhận thông tin đăng nhập (account/link/code/QR) ngay sau khi thanh toán thành công
              </AlertDescription>
            </Alert>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-12 md:h-14">
              <TabsTrigger value="description" className="text-sm md:text-base">Mô tả</TabsTrigger>
              <TabsTrigger value="warranty" className="text-sm md:text-base">Bảo hành</TabsTrigger>
              <TabsTrigger value="howToUse" className="text-sm md:text-base">Hướng dẫn sử dụng</TabsTrigger>
              <TabsTrigger value="reviews" className="text-sm md:text-base">
                Đánh giá shop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="space-y-4 mt-6 md:mt-8">
              <div className="prose max-w-none">
                <p className="text-base md:text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
                  {product.description}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="warranty" className="space-y-4 mt-6 md:mt-8">
              <div className="space-y-4 md:space-y-6">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 md:h-7 md:w-7 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg md:text-xl mb-2">Chính sách bảo hành</p>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      {product.warranty}
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground mt-3 leading-relaxed">
                      Nếu gặp vấn đề (sai gói, không dùng được, bị thu hồi sớm), bạn có thể tạo Support Ticket để được xử lý đổi hàng/hoàn tiền.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <HelpCircle className="h-6 w-6 md:h-7 md:w-7 text-orange-500 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg md:text-xl mb-2">Khiếu nại & hỗ trợ</p>
                    <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                      Tạo Support Ticket gắn với OrderItem ngay trong đơn hàng nếu gặp vấn đề. Moderator/Admin sẽ xử lý dựa trên bằng chứng giao hàng.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="howToUse" className="space-y-4 mt-6 md:mt-8">
              <div className="prose max-w-none">
                <p className="text-base md:text-lg text-muted-foreground whitespace-pre-line leading-relaxed">
                  {product.howToUse}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <ProductReviews
                productId={productId}
                currentUserId={isAuthenticated ? currentUser?.id : undefined}
              />
            </TabsContent>
          </Tabs>

          {/* Shop Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl flex items-center gap-3">
                <User className="h-6 w-6 md:h-7 md:w-7" />
                Thông tin Shop
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              <Link
                href={`/shops/${product.shop.id}`}
                className="flex items-center gap-4 hover:bg-muted/50 p-3 md:p-4 rounded-lg transition-colors"
              >
                <Avatar className="h-12 w-12 md:h-14 md:w-14">
                  <AvatarFallback className="text-lg md:text-xl">
                    {product.shop.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                    <p className="font-semibold text-base md:text-lg">{product.shop.name}</p>
                    {product.shop.isVerified && (
                      <Badge variant="secondary" className="text-sm px-2.5 py-1">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Đã xác minh
                      </Badge>
                    )}
                    <Badge 
                      variant={product.shop.status === "active" ? "default" : "secondary"}
                      className="text-sm px-2.5 py-1"
                    >
                      {product.shop.status === "active" ? "Hoạt động" : product.shop.status}
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-sm bg-green-50 mt-2 px-2.5 py-1">
                    {product.shop.trustLevel}
                  </Badge>
                </div>
              </Link>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-base">
                <div>
                  <p className="text-muted-foreground mb-2">Sản phẩm</p>
                  <p className="font-semibold text-lg md:text-xl">{product.shop.listingCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Đã bán</p>
                  <p className="font-semibold text-lg md:text-xl">
                    {product.shop.soldCount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Đánh giá</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 md:h-6 md:w-6 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-lg md:text-xl">
                      {product.shop.rating ? product.shop.rating.toFixed(1) : "0"}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      ({product.shop.reviewCount})
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Phản hồi</p>
                  <p className="font-semibold text-lg md:text-xl">{product.shop.responseRate}%</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 h-11 md:h-12 text-base" asChild>
                  <Link href={`/shops/${product.shop.id}`}>
                    Xem shop
                  </Link>
                </Button>
                <ChatWithShopButton
                  shopId={product.shop.id}
                  shopName={product.shop.name}
                  sellerUserId={product.shop.ownerId}
                  variant="outline"
                  className="h-11 md:h-12"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Purchase Card */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">Mua ngay</CardTitle>
              <CardDescription className="text-base">
                Thanh toán an toàn với escrow - Tiền được giữ đến khi bạn nhận hàng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 md:space-y-6">
              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="text-base md:text-lg font-medium">Số lượng</label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <span className="text-xl">-</span>
                  </Button>
                  <span className="w-16 text-center font-semibold text-lg md:text-xl">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-11 w-11"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={
                      product.inventoryCount
                        ? quantity >= product.inventoryCount
                        : false
                    }
                  >
                    <span className="text-xl">+</span>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Price Summary */}
              <div className="space-y-3">
                <div className="flex justify-between text-base md:text-lg">
                  <span className="text-muted-foreground">Đơn giá:</span>
                  <span className="font-semibold">
                    {formatPrice(product.price)}
                  </span>
                </div>
                <div className="flex justify-between text-base md:text-lg">
                  <span className="text-muted-foreground">Số lượng:</span>
                  <span className="font-semibold">{quantity}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg md:text-xl font-bold pt-2">
                  <span>Tổng cộng:</span>
                  <span className="text-primary text-2xl md:text-3xl">
                    {formatPrice(product.price * quantity)}
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="space-y-3">
                <Button
                  className="w-full h-12 md:h-14 text-base md:text-lg"
                  size="lg"
                  onClick={handleBuyNow}
                  disabled={!product.inStock}
                >
                  {product.inStock ? "Mua ngay" : "Hết hàng"}
                </Button>
              </div>

              {!product.inStock && (
                <Alert variant="warning">
                  <AlertIcon.warning className="h-5 w-5" />
                  <AlertDescription className="text-base">
                    Sản phẩm tạm thời hết hàng. Vui lòng quay lại sau.
                  </AlertDescription>
                </Alert>
              )}

              {/* Security Info */}
              <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm md:text-base">
                <p className="flex items-center gap-3">
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-blue-500 flex-shrink-0" />
                  Thanh toán an toàn với escrow
                </p>
                <p className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
                  Giao hàng tức thì sau thanh toán
                </p>
                <p className="flex items-center gap-3">
                  <Lock className="h-4 w-4 md:h-5 md:w-5 text-orange-500 flex-shrink-0" />
                  Bảo mật thông tin đăng nhập
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
