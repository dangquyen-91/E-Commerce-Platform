"use client";

import { useEffect, useMemo, useState } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { inventoryService, type InventoryItem as SellerInventoryItem } from "@/lib/services/inventory.service";
import { productService, type ProductResponse } from "@/lib/services/product.service";
import { shopService } from "@/lib/services/shop.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Database, Eye, EyeOff, Copy } from "lucide-react";

type StatusFilter = "all" | "Available" | "Reserved" | "Delivered" | "Revoked";

const PAGE_SIZE = 10;
const SKELETON_3 = ["a", "b", "c"] as const;
const SKELETON_5 = ["a", "b", "c", "d", "e"] as const;

interface PlatformInventorySummary {
  platformId: string;
  platformName: string;
  logoUrl?: string;
  total: number;
  available: number;
  reserved: number;
  delivered: number;
}

interface ProductWithInventorySummary {
  product: ProductResponse;
  available: number;
  reserved: number;
  delivered: number;
  revoked: number;
}

export default function SellerInventoryPage() {
  const [items, setItems] = useState<SellerInventoryItem[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [addInventoryOpen, setAddInventoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResponse | null>(null);
  const [secretType, setSecretType] = useState<"Account" | "InviteLink" | "Code" | "QR">("Account");
  const [keysText, setKeysText] = useState("");
  const [isSubmittingInventory, setIsSubmittingInventory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [paginatedItems, setPaginatedItems] = useState<SellerInventoryItem[]>([]);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());

  const toggleSecretVisibility = (itemId: string) => {
    setVisibleSecrets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Đã sao chép vào clipboard");
    } catch {
      toast.error("Không thể sao chép");
    }
  };

  // Fetch all items for summary (platforms, products overview)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const myShop = await shopService.getMyShop();
        if (!myShop) {
          setProducts([]);
          setItems([]);
          setIsLoading(false);
          return;
        }

        const [productsRes, inventoryRes] = await Promise.all([
          productService.getMyProducts(myShop._id),
          inventoryService.getMyInventory({ limit: 1000 }),
        ]);

        setProducts(productsRes.data || []);
        setItems(inventoryRes.items);
      } catch (error) {
        console.error("[SellerInventory] Failed to load summary:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch paginated items for detailed list
  const fetchPaginatedItems = async (page: number, status: StatusFilter) => {
    try {
      const skip = (page - 1) * PAGE_SIZE;
      const params: { limit: number; skip: number; status?: string } = {
        limit: PAGE_SIZE,
        skip,
      };
      if (status !== "all") {
        params.status = status;
      }
      const res = await inventoryService.getMyInventory(params);
      setPaginatedItems(res.items);
      setTotalItems(res.total);
    } catch (error) {
      console.error("[SellerInventory] Failed to load paginated items:", error);
    }
  };

  // Refetch when page or filter changes
  useEffect(() => {
    if (!isLoading) {
      fetchPaginatedItems(currentPage, statusFilter);
    }
  }, [currentPage, statusFilter, isLoading]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const platformSummaries = useMemo<PlatformInventorySummary[]>(() => {
    const map = new Map<string, PlatformInventorySummary>();

    for (const item of items) {
      const key = item.platformId?._id || "unknown";
      const entry =
        map.get(key) ||
        ({
          platformId: key,
          platformName: item.platformId?.platformName || "Khác",
          logoUrl: item.platformId?.logoUrl,
          total: 0,
          available: 0,
          reserved: 0,
          delivered: 0,
        } as PlatformInventorySummary);

      entry.total += 1;
      if (item.status === "Available") entry.available += 1;
      if (item.status === "Reserved") entry.reserved += 1;
      if (item.status === "Delivered") entry.delivered += 1;

      map.set(key, entry);
    }

    return Array.from(map.values()).sort((a, b) =>
      a.platformName.localeCompare(b.platformName)
    );
  }, [items]);

  const productsWithInventory = useMemo<ProductWithInventorySummary[]>(() => {
    const countsByProduct = new Map<
      string,
      { available: number; reserved: number; delivered: number; revoked: number }
    >();

    for (const item of items) {
      const productId = item.productId?._id || "unknown";

      const entry =
        countsByProduct.get(productId) || {
          available: 0,
          reserved: 0,
          delivered: 0,
          revoked: 0,
        };

      if (item.status === "Available") entry.available += 1;
      if (item.status === "Reserved") entry.reserved += 1;
      if (item.status === "Delivered") entry.delivered += 1;
      if (item.status === "Revoked") entry.revoked += 1;

      countsByProduct.set(productId, entry);
    }

    return products.map((p) => {
      const productId = p._id || p.id || "";

      const counts = countsByProduct.get(productId) || {
        available: 0,
        reserved: 0,
        delivered: 0,
        revoked: 0,
      };

      return {
        product: p,
        ...counts,
      };
    });
  }, [products, items]);

  const productPriceById = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const productId = p._id || p.id || "";
      if (productId && typeof p.price === "number") {
        map.set(productId, p.price);
      }
    }
    return map;
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const getStatusBadge = (status: SellerInventoryItem["status"]) => {
    switch (status) {
      case "Available":
        return <Badge variant="outline" className="border-green-500 text-green-600">Còn hàng</Badge>;
      case "Reserved":
        return <Badge variant="outline" className="border-amber-500 text-amber-600">Đã giữ</Badge>;
      case "Delivered":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Đã giao</Badge>;
      case "Revoked":
        return <Badge variant="outline" className="border-red-500 text-red-600">Thu hồi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const openAddInventoryDialog = (product: ProductResponse) => {
    setSelectedProduct(product);
    setSecretType("Account");
    setKeysText("");
    setAddInventoryOpen(true);
  };

  const handleAddInventory = async () => {
    if (!selectedProduct?._id && !selectedProduct?.id) {
      toast.error("Không xác định được sản phẩm");
      return;
    }

    const productId = selectedProduct._id || selectedProduct.id!;
    const lines = keysText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.error("Vui lòng nhập ít nhất một key/tài khoản");
      return;
    }

    setIsSubmittingInventory(true);
    try {
      const result = await inventoryService.addBulkInventory({
        productId,
        items: lines.map((value) => ({
          secretType,
          secretValue: value,
        })),
      });

      if (result.added > 0) {
        toast.success(`Đã thêm ${result.added} item vào kho${result.errors.length > 0 ? ` (lỗi: ${result.errors.length})` : ""}`);
      } else {
        toast.error(`Không thể thêm item vào kho${result.errors.length > 0 ? ` (${result.errors.length} lỗi)` : ""}`);
      }

      // Refresh inventory data
      const myShop = await shopService.getMyShop();
      if (myShop) {
        const [productsRes, inventoryRes] = await Promise.all([
          productService.getMyProducts(myShop._id),
          inventoryService.getMyInventory({ limit: 500 }),
        ]);
        setProducts(productsRes.data || []);
        setItems(inventoryRes.items);
      }

      setAddInventoryOpen(false);
    } catch (error: unknown) {
      const maybeMessage =
        error && typeof error === "object" && "message" in error
          ? (error as { message?: unknown }).message
          : undefined;
      const message =
        typeof maybeMessage === "string"
          ? maybeMessage
          : "Không thể thêm inventory. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setIsSubmittingInventory(false);
    }
  };

  const platformOverviewContent = (() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SKELETON_3.map((k) => (
            <Skeleton key={`platform-skel-${k}`} className="h-24 w-full" />
          ))}
        </div>
      );
    }

    if (platformSummaries.length === 0) {
      return (
        <Alert>
          <Package className="h-4 w-4 mr-2" />
          <AlertDescription>
            Chưa có item nào trong kho. Hãy thêm inventory cho sản phẩm của bạn.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platformSummaries.map((p) => (
          <Card key={p.platformId} className="border-dashed">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.logoUrl}
                      alt={p.platformName}
                      className="h-8 w-8 rounded-md border bg-muted object-cover"
                    />
                  ) : (
                    <Database className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="font-semibold">{p.platformName}</span>
                </div>
                <Badge variant="secondary">Tổng: {p.total}</Badge>
              </div>
              <div className="flex flex-wrap gap-2 text-sm mt-1">
                <Badge variant="outline">Còn hàng: {p.available}</Badge>
                <Badge variant="outline">Đã giữ: {p.reserved}</Badge>
                <Badge variant="outline">Đã giao: {p.delivered}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  })();

  const productsOverviewContent = (() => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {SKELETON_5.map((k) => (
            <Skeleton key={`product-skel-${k}`} className="h-10 w-full" />
          ))}
        </div>
      );
    }

    if (productsWithInventory.length === 0) {
      return (
        <Alert>
          <AlertDescription>Bạn chưa có sản phẩm nào trong shop.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[160px]">Sản phẩm</TableHead>
              <TableHead>Giá</TableHead>
              <TableHead>Available</TableHead>
              <TableHead>Reserved</TableHead>
              <TableHead>Delivered</TableHead>
              <TableHead>Revoked</TableHead>
              <TableHead className="min-w-[120px] text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsWithInventory.map(({ product, available, reserved, delivered, revoked }) => (
              <TableRow key={product._id || product.id}>
                <TableCell className="font-medium">{product.title}</TableCell>
                <TableCell>{product.price.toLocaleString("vi-VN")} VND</TableCell>
                <TableCell>{available}</TableCell>
                <TableCell>{reserved}</TableCell>
                <TableCell>{delivered}</TableCell>
                <TableCell>{revoked}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAddInventoryDialog(product)}
                  >
                    Thêm vào kho
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  })();

  const detailItemsContent = (() => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          {SKELETON_5.map((k) => (
            <Skeleton key={`detail-skel-${k}`} className="h-10 w-full" />
          ))}
        </div>
      );
    }

    if (paginatedItems.length === 0) {
      return (
        <Alert>
          <AlertDescription>Không có item nào với bộ lọc hiện tại.</AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-3">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[140px]">Sản phẩm</TableHead>
                <TableHead className="min-w-[120px]">Nền tảng</TableHead>
                <TableHead className="min-w-[200px]">Secret Key</TableHead>
                <TableHead className="min-w-[160px]">Khách đã thanh toán</TableHead>
                <TableHead>Loại secret</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => {
                const isSecretVisible = visibleSecrets.has(item._id);
                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.productId?.title || "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.platformId?.logoUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.platformId.logoUrl}
                            alt={item.platformId?.platformName || ""}
                            className="h-5 w-5 rounded object-cover"
                          />
                        )}
                        <span>{item.platformId?.platformName || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded break-all">
                          {isSecretVisible ? item.secretValue : "••••••••••••"}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleSecretVisibility(item._id)}
                          title={isSecretVisible ? "Ẩn" : "Hiện"}
                        >
                          {isSecretVisible ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyToClipboard(item.secretValue)}
                          title="Sao chép"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const productId = item.productId?._id || "";
                        const price =
                          typeof productId === "string" ? productPriceById.get(productId) : undefined;
                        return item.status === "Delivered" && typeof price === "number"
                          ? `${price.toLocaleString("vi-VN")} VND`
                          : "-";
                      })()}
                    </TableCell>
                    <TableCell>{item.secretType}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      {(() => {
                        const d = item.createdAt ? new Date(item.createdAt) : null;
                        return d && !Number.isNaN(d.getTime())
                          ? d.toLocaleString("vi-VN")
                          : "-";
                      })()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Tổng: <span className="font-medium">{totalItems}</span> item
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      </div>
    );
  })();

  return (
    <RequireAuth requiredRole="seller">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 space-y-6 md:space-y-8">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold">Kho hàng</h1>
          <p className="text-base text-muted-foreground">
            Theo dõi các item trong kho theo từng nền tảng, từng sản phẩm và trạng thái giao hàng.
          </p>
        </div>

        {/* Overview by platform */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan theo nền tảng</CardTitle>
            <CardDescription>
              Số lượng item trong kho, phân tách theo từng nền tảng (platform).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {platformOverviewContent}
          </CardContent>
        </Card>

        {/* Products overview with inventory counts (includes products with 0 inventory) */}
        <Card>
          <CardHeader>
            <CardTitle>Sản phẩm trong kho</CardTitle>
            <CardDescription>
              Mỗi sản phẩm trong shop và số lượng inventory (kể cả sản phẩm chưa có inventory sẽ hiển thị 0).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {productsOverviewContent}
          </CardContent>
        </Card>

        {/* Detailed list of inventory items */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle>Chi tiết item trong kho</CardTitle>
                <CardDescription>
                  Danh sách từng item inventory, kèm sản phẩm, nền tảng và trạng thái.
                </CardDescription>
              </div>
              <Tabs
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as StatusFilter)}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 md:grid-cols-5 w-full">
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="Available">Còn hàng</TabsTrigger>
                  <TabsTrigger value="Reserved">Đã giữ</TabsTrigger>
                  <TabsTrigger value="Delivered">Đã giao</TabsTrigger>
                  <TabsTrigger value="Revoked">Thu hồi</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {detailItemsContent}
          </CardContent>
        </Card>

        {/* Dialog thêm inventory cho sản phẩm */}
        <Dialog open={addInventoryOpen} onOpenChange={setAddInventoryOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm inventory cho sản phẩm</DialogTitle>
              <DialogDescription>
                Chọn kiểu key/tài khoản và dán danh sách (mỗi dòng một key) để thêm nhanh vào kho.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="text-sm">
                <span className="font-medium">Sản phẩm:&nbsp;</span>
                <span>{selectedProduct?.title || "Chưa chọn"}</span>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="inventory-secretType">
                  Kiểu secret *
                </label>
                <Select
                  value={secretType}
                  onValueChange={(v) =>
                    setSecretType(v as "Account" | "InviteLink" | "Code" | "QR")
                  }
                >
                  <SelectTrigger id="inventory-secretType">
                    <SelectValue placeholder="Chọn kiểu secret" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Account">Account (email:password,...)</SelectItem>
                    <SelectItem value="Code">Code (mã kích hoạt)</SelectItem>
                    <SelectItem value="InviteLink">InviteLink (link mời)</SelectItem>
                    <SelectItem value="QR">QR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="inventory-keysText">
                  Danh sách key / tài khoản (mỗi dòng một mục) *
                </label>
                <Textarea
                  id="inventory-keysText"
                  value={keysText}
                  onChange={(e) => setKeysText(e.target.value)}
                  placeholder={"Ví dụ:\nemail1@example.com:pass1\nemail2@example.com:pass2\n..."}
                  className="min-h-[160px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddInventoryOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleAddInventory}
                disabled={isSubmittingInventory}
              >
                {isSubmittingInventory ? "Đang thêm..." : "Thêm vào kho"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}

