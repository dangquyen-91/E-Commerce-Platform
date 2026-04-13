import api from "../api";

export interface InventoryItem {
  _id: string;
  shopId: string;
  platformId: {
    _id: string;
    platformName: string;
    logoUrl?: string;
  } | null;
  productId: {
    _id: string;
    title: string;
  } | null;
  secretType: "Account" | "InviteLink" | "Code" | "QR";
  secretValue: string;
  status: "Available" | "Reserved" | "Delivered" | "Revoked";
  reservedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export interface InventoryStats {
  total: number;
  available: number;
  reserved: number;
  delivered: number;
}

export interface AddInventoryInput {
  productId: string;
  secretType: "Account" | "InviteLink" | "Code" | "QR";
  secretValue: string;
}

export interface BulkInventoryInput {
  productId: string;
  items: Array<{
    secretType: string;
    secretValue: string;
  }>;
}

class InventoryService {
  /**
   * Get my inventory items
   */
  async getMyInventory(params?: {
    productId?: string;
    status?: string;
    limit?: number;
    skip?: number;
  }): Promise<{ items: InventoryItem[]; total: number }> {
    const response = await api.get("/inventory", { params });

    // api.get returns response.data directly, so structure is:
    // response = { success: true, data: [...items...], pagination: {...} }
    const items = Array.isArray(response.data) ? response.data : [];
    const pagination = (response as any).pagination || {};

    return {
      items,
      total: typeof pagination.total === "number" ? pagination.total : items.length,
    };
  }

  /**
   * Get inventory stats
   */
  async getInventoryStats(): Promise<InventoryStats> {
    const response = await api.get<InventoryStats>("/inventory/stats");
    // api.get returns { success, data } - extract data directly
    const raw = response.data as InventoryStats | undefined;

    return {
      total: raw?.total ?? 0,
      available: raw?.available ?? 0,
      reserved: raw?.reserved ?? 0,
      delivered: raw?.delivered ?? 0,
    };
  }

  /**
   * Add single inventory item
   */
  async addInventoryItem(input: AddInventoryInput): Promise<InventoryItem> {
    const response = await api.post<{ data: InventoryItem }>("/inventory", input);
    return (response.data as { data: InventoryItem }).data;
  }

  /**
   * Add bulk inventory items
   */
  async addBulkInventory(input: BulkInventoryInput): Promise<{
    added: number;
    errors: string[];
  }> {
    const response = await api.post<{ added: number; errors: string[] }>("/inventory/bulk", input);
    // api.post returns ApiResponse<T> = { success, data }
    // response.data contains { added, errors }
    const data = response.data as { added?: number; errors?: string[] } | undefined;
    return {
      added: typeof data?.added === "number" ? data.added : 0,
      errors: Array.isArray(data?.errors) ? data.errors : [],
    };
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(
    itemId: string,
    updates: { secretType?: string; secretValue?: string }
  ): Promise<InventoryItem> {
    const response = await api.put<{ data: InventoryItem }>(`/inventory/${itemId}`, updates);
    return (response.data as { data: InventoryItem }).data;
  }

  /**
   * Delete inventory item
   */
  async deleteInventoryItem(itemId: string): Promise<void> {
    await api.delete(`/inventory/${itemId}`);
  }

  /**
   * Get available count for a product
   */
  async getAvailableCount(productId: string): Promise<number> {
    const response = await api.get(`/inventory/product/${productId}/count`);
    // response = { success: true, data: { availableCount: number } }
    const data = response.data as { availableCount: number };
    return data.availableCount ?? 0;
  }
}

export const inventoryService = new InventoryService();
