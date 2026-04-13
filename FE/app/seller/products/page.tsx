"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { useShop } from "@/lib/hooks/useShop";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function SellerProductsPage() {
  const router = useRouter();
  const { shop, loading: shopLoading, hasActiveShop } = useShop();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!shop?._id) return;

      try {
        const response = await productService.getMyProducts(shop._id);
        if (response.success && response.data) {
          setProducts(response.data);
          setFilteredProducts(response.data);
        }
      } catch (error) {
        toast.error("Không thể tải danh sách sản phẩm");
      } finally {
        setLoading(false);
      }
    };

    if (shop?._id) {
      fetchProducts();
    }
  }, [shop?._id]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProducts(products);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredProducts(
        products.filter(
          (p) =>
            p.title.toLowerCase().includes(query) ||
            p.planType.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, products]);

  const handleDelete = async () => {
    if (!deleteProductId) return;

    setIsDeleting(true);
    try {
      const response = await productService.deleteProduct(deleteProductId);
      if (response.success) {
        setProducts((prev) => prev.filter((p) => (p._id || p.id) !== deleteProductId));
        toast.success("Đã xóa sản phẩm thành công");
      } else {
        toast.error(response.message || "Không thể xóa sản phẩm");
      }
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm");
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500">Đang bán</Badge>;
      case "Pending":
        return <Badge variant="secondary">Chờ duyệt</Badge>;
      case "Rejected":
        return <Badge variant="destructive">Bị từ chối</Badge>;
      case "Inactive":
        return <Badge variant="outline">Ngừng bán</Badge>;
      default:
        return <Badge variant="outline">{status || "N/A"}</Badge>;
    }
  };

  if (shopLoading || loading) {
    return (
      <div className="container py-8 max-w-6xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!hasActiveShop) {
    return (
      <div className="container py-8 max-w-6xl text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Bạn chưa có cửa hàng</h2>
        <p className="text-muted-foreground mb-6">
          Vui lòng tạo cửa hàng trước khi quản lý sản phẩm.
        </p>
        <Button onClick={() => router.push("/seller/register")}>
          Tạo cửa hàng ngay
        </Button>
      </div>
    );
  }

  return (
    <RequireAuth requiredRole="seller">
      <div className="container py-8 max-w-6xl">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Quản lý sản phẩm</h1>
              <p className="text-muted-foreground">
                {products.length} sản phẩm trong cửa hàng
              </p>
            </div>
            <Button asChild>
              <Link href="/seller/products/create">
                <Plus className="mr-2 h-4 w-4" />
                Thêm sản phẩm
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery
                      ? "Không tìm thấy sản phẩm phù hợp"
                      : "Chưa có sản phẩm nào"}
                  </p>
                  {!searchQuery && (
                    <Button asChild className="mt-4">
                      <Link href="/seller/products/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm sản phẩm đầu tiên
                      </Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Ảnh</TableHead>
                        <TableHead>Tên sản phẩm</TableHead>
                        <TableHead>Loại gói</TableHead>
                        <TableHead>Thời hạn</TableHead>
                        <TableHead className="text-right">Giá</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => {
                        const productId = product._id || product.id;
                        return (
                          <TableRow key={productId}>
                            <TableCell>
                              {product.thumbnailUrl ? (
                                <Image
                                  src={product.thumbnailUrl}
                                  alt={product.title}
                                  width={48}
                                  height={48}
                                  className="rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium max-w-[200px] truncate">
                              {product.title}
                            </TableCell>
                            <TableCell>{product.planType}</TableCell>
                            <TableCell>{product.durationDays} ngày</TableCell>
                            <TableCell className="text-right">
                              {product.price.toLocaleString()}đ
                            </TableCell>
                            <TableCell>{getStatusBadge(product.status)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  asChild
                                >
                                  <Link href={`/seller/products/${productId}/edit`}>
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => setDeleteProductId(productId!)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RequireAuth>
  );
}
