import { apiClient } from "@/lib/api";

export type PlatformCatalogStatus = "Active" | "Hidden";

export interface PlatformCatalog {
  _id: string;
  platformName: string;
  logoUrl?: string | null;
  status: PlatformCatalogStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertPlatformCatalogPayload {
  platformName: string;
  logoUrl?: string | null;
  status?: PlatformCatalogStatus;
}

class PlatformCatalogService {
  async getAll() {
    const response = await apiClient.get<PlatformCatalog[]>("/platform-catalogs");
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Không thể tải danh mục");
  }

  async create(payload: UpsertPlatformCatalogPayload) {
    const response = await apiClient.post<PlatformCatalog>("/platform-catalogs", payload);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Không thể tạo danh mục");
  }

  async update(id: string, payload: Partial<UpsertPlatformCatalogPayload>) {
    const response = await apiClient.put<PlatformCatalog>(`/platform-catalogs/${id}`, payload);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Không thể cập nhật danh mục");
  }

  async remove(id: string) {
    const response = await apiClient.delete(`/platform-catalogs/${id}`);
    if (response.success) return true;
    throw new Error(response.message || "Không thể xóa danh mục");
  }
}

export const platformCatalogService = new PlatformCatalogService();

