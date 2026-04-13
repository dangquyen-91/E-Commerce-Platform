import { BaseService } from "../base.service";
import { InventoryItem, IInventoryItem, Shop, Product } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import mongoose from "mongoose";
import { encryptSecret, decryptSecret } from "@/utils/helpers";

export interface CreateInventoryInput {
  productId: string;
  secretType: "Account" | "InviteLink" | "Code" | "QR";
  secretValue: string;
}

export interface InventoryFilter {
  shopId?: string;
  productId?: string;
  status?: string;
  limit?: number;
  skip?: number;
}

export class InventoryService extends BaseService<IInventoryItem> {
  constructor() {
    super(InventoryItem);
  }

  /**
   * Get shop by owner user ID
   */
  private async getShopByOwner(userId: string): Promise<any> {
    const shop = await Shop.findOne({
      ownerUserId: new mongoose.Types.ObjectId(userId),
      isDeleted: false,
      status: "Active",
    });
    return shop;
  }

  /**
   * Add inventory item for a product
   */
  async addInventoryItem(
    userId: string,
    input: CreateInventoryInput
  ): Promise<IInventoryItem> {
    // Get seller's shop
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new AppError("Bạn chưa có shop hoặc shop chưa được duyệt", 403);
    }

    // Verify product belongs to this shop
    const product = await Product.findOne({
      _id: input.productId,
      shopId: shop._id,
      isDeleted: false,
    });

    if (!product) {
      throw new AppError("Sản phẩm không tồn tại hoặc không thuộc shop của bạn", 404);
    }

    // Encrypt secret before storing
    const encryptedSecret = encryptSecret(input.secretValue);

    // Create inventory item
    const inventoryItem = await InventoryItem.create({
      shopId: shop._id,
      platformId: product.platformId,
      productId: product._id,
      secretType: input.secretType,
      secretValue: encryptedSecret,
      status: "Available",
      createdAt: new Date(),
      isDeleted: false,
    });

    return inventoryItem;
  }

  /**
   * Add multiple inventory items (bulk)
   */
  async addBulkInventory(
    userId: string,
    productId: string,
    items: Array<{ secretType: string; secretValue: string }>
  ): Promise<{ added: number; errors: string[] }> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new AppError("Bạn chưa có shop hoặc shop chưa được duyệt", 403);
    }

    const product = await Product.findOne({
      _id: productId,
      shopId: shop._id,
      isDeleted: false,
    });

    if (!product) {
      throw new AppError("Sản phẩm không tồn tại hoặc không thuộc shop của bạn", 404);
    }

    const errors: string[] = [];
    let added = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const encryptedSecret = encryptSecret(item.secretValue);

        await InventoryItem.create({
          shopId: shop._id,
          platformId: product.platformId,
          productId: product._id,
          secretType: item.secretType,
          secretValue: encryptedSecret,
          status: "Available",
          createdAt: new Date(),
          isDeleted: false,
        });
        added++;
      } catch (error: any) {
        errors.push(`Item ${i + 1}: ${error.message}`);
      }
    }

    return { added, errors };
  }

  /**
   * Get inventory items for seller's shop
   */
  async getMyInventory(
    userId: string,
    filter: InventoryFilter = {}
  ): Promise<{ items: IInventoryItem[]; total: number }> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      return { items: [], total: 0 };
    }

    const { productId, status, limit = 50, skip = 0 } = filter;

    const query: any = {
      shopId: shop._id,
      isDeleted: false,
    };

    if (productId) {
      query.productId = new mongoose.Types.ObjectId(productId);
    }

    if (status) {
      query.status = status;
    }

    const [items, total] = await Promise.all([
      InventoryItem.find(query)
        .populate("productId", "_id title platformId")
        .populate("platformId", "_id platformName logoUrl")
        // createdAt might be missing in old docs; use _id as tie-breaker for stable pagination
        .sort({ createdAt: -1, _id: -1 })
        .limit(limit)
        .skip(skip)
        .lean(),
      InventoryItem.countDocuments(query),
    ]);

    // Decrypt secrets before returning to seller (so họ vẫn thấy được key gốc)
    const decryptedItems = items.map((item: any) => {
      if (item.secretValue) {
        item.secretValue = decryptSecret(item.secretValue as string);
      }
      return item;
    });

    return { items: decryptedItems as IInventoryItem[], total };
  }

  /**
   * Get inventory stats for seller
   */
  async getInventoryStats(userId: string): Promise<{
    total: number;
    available: number;
    reserved: number;
    delivered: number;
  }> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      return { total: 0, available: 0, reserved: 0, delivered: 0 };
    }

    const stats = await InventoryItem.aggregate([
      {
        $match: {
          shopId: shop._id,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      available: 0,
      reserved: 0,
      delivered: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      if (stat._id === "Available") result.available = stat.count;
      if (stat._id === "Reserved") result.reserved = stat.count;
      if (stat._id === "Delivered") result.delivered = stat.count;
    });

    return result;
  }

  /**
   * Update inventory item
   */
  async updateInventoryItem(
    userId: string,
    itemId: string,
    updates: { secretType?: string; secretValue?: string }
  ): Promise<IInventoryItem | null> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new AppError("Bạn chưa có shop", 403);
    }

    const item = await InventoryItem.findOne({
      _id: itemId,
      shopId: shop._id,
      isDeleted: false,
    });

    if (!item) {
      throw new AppError("Inventory item không tồn tại", 404);
    }

    if (item.status !== "Available") {
      throw new AppError("Chỉ có thể cập nhật inventory item đang Available", 400);
    }

    if (updates.secretType) item.secretType = updates.secretType as any;
    if (updates.secretValue) {
      item.secretValue = encryptSecret(updates.secretValue);
    }

    await item.save();
    return item;
  }

  /**
   * Delete (soft) inventory item
   */
  async deleteInventoryItem(userId: string, itemId: string): Promise<boolean> {
    const shop = await this.getShopByOwner(userId);
    if (!shop) {
      throw new AppError("Bạn chưa có shop", 403);
    }

    const item = await InventoryItem.findOne({
      _id: itemId,
      shopId: shop._id,
      isDeleted: false,
    });

    if (!item) {
      throw new AppError("Inventory item không tồn tại", 404);
    }

    if (item.status !== "Available") {
      throw new AppError("Chỉ có thể xóa inventory item đang Available", 400);
    }

    item.isDeleted = true;
    await item.save();
    return true;
  }

  /**
   * Get available inventory count for a product
   */
  async getAvailableCount(productId: string): Promise<number> {
    return InventoryItem.countDocuments({
      productId: new mongoose.Types.ObjectId(productId),
      status: "Available",
      isDeleted: false,
    });
  }
}

export const inventoryService = new InventoryService();
