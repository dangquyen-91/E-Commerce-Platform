"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  platformCatalogService,
  type PlatformCatalog,
  type PlatformCatalogStatus,
} from "@/lib/services/platform-catalog.service";
import { Edit, Loader2, Package, Plus, Trash2 } from "lucide-react";

const EMPTY_FORM = {
  platformName: "",
  logoUrl: "",
  status: "Active" as PlatformCatalogStatus,
};

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<PlatformCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<PlatformCatalog | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await platformCatalogService.getAll();
      setItems(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể tải danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const resetForm = () => setForm(EMPTY_FORM);

  const handleCreate = async () => {
    if (!form.platformName.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setSubmitting(true);
    try {
      await platformCatalogService.create({
        platformName: form.platformName.trim(),
        logoUrl: form.logoUrl.trim() || null,
        status: form.status,
      });
      toast.success("Tạo danh mục thành công");
      setOpenCreate(false);
      resetForm();
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Tạo danh mục thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (item: PlatformCatalog) => {
    setEditing(item);
    setForm({
      platformName: item.platformName,
      logoUrl: item.logoUrl || "",
      status: item.status,
    });
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    if (!form.platformName.trim()) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    setSubmitting(true);
    try {
      await platformCatalogService.update(editing._id, {
        platformName: form.platformName.trim(),
        logoUrl: form.logoUrl.trim() || null,
        status: form.status,
      });
      toast.success("Cập nhật danh mục thành công");
      setOpenEdit(false);
      setEditing(null);
      resetForm();
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Cập nhật danh mục thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa danh mục này?")) return;

    try {
      await platformCatalogService.remove(id);
      toast.success("Đã xóa danh mục");
      await fetchItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa danh mục thất bại");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
          <p className="text-sm text-muted-foreground">Chỉ admin có quyền thêm/sửa/xóa danh mục</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> Danh sách danh mục
          </CardTitle>
          <CardDescription>Tổng: {items.length} danh mục</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Chưa có danh mục nào.</div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-semibold">{item.platformName}</div>
                    <div className="text-xs text-muted-foreground break-all">
                      {item.logoUrl || "Không có logo URL"}
                    </div>
                    <Badge variant={item.status === "Active" ? "default" : "secondary"}>
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                      <Edit className="mr-1 h-4 w-4" /> Sửa
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item._id)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Xóa
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm danh mục</DialogTitle>
            <DialogDescription>Tạo danh mục mới cho hệ thống</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              placeholder="Tên danh mục"
              value={form.platformName}
              onChange={(e) => setForm((prev) => ({ ...prev, platformName: e.target.value }))}
            />
            <Input
              placeholder="Logo URL (optional)"
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
            />
            <Select
              value={form.status}
              onValueChange={(v: PlatformCatalogStatus) => setForm((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Hủy</Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật danh mục</DialogTitle>
            <DialogDescription>Chỉnh sửa thông tin danh mục</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Input
              placeholder="Tên danh mục"
              value={form.platformName}
              onChange={(e) => setForm((prev) => ({ ...prev, platformName: e.target.value }))}
            />
            <Input
              placeholder="Logo URL (optional)"
              value={form.logoUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, logoUrl: e.target.value }))}
            />
            <Select
              value={form.status}
              onValueChange={(v: PlatformCatalogStatus) => setForm((prev) => ({ ...prev, status: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Hidden">Hidden</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>Hủy</Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

