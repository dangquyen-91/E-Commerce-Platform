import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { InventoryService } from "@/services/inventory/inventory.service";
import { AppError } from "@/middleware/errorHandler";

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * Get my inventory items
   * GET /api/inventory
   */
  getMyInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { productId, status, limit, skip } = req.query;

      const result = await this.inventoryService.getMyInventory(userId, {
        productId: productId as string,
        status: status as string,
        limit: limit ? Number(limit) : 50,
        skip: skip ? Number(skip) : 0,
      });

      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          limit: limit ? Number(limit) : 50,
          skip: skip ? Number(skip) : 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get inventory stats
   * GET /api/inventory/stats
   */
  getInventoryStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const stats = await this.inventoryService.getInventoryStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add single inventory item
   * POST /api/inventory
   */
  addInventoryItem = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { productId, secretType, secretValue } = req.body;

      if (!productId || !secretType || !secretValue) {
        throw new AppError("Vui lòng cung cấp đầy đủ thông tin", 400);
      }

      const item = await this.inventoryService.addInventoryItem(userId, {
        productId,
        secretType,
        secretValue,
      });

      res.status(201).json({
        success: true,
        message: "Thêm inventory thành công",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add bulk inventory items
   * POST /api/inventory/bulk
   */
  addBulkInventory = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { productId, items } = req.body;

      if (!productId || !items || !Array.isArray(items) || items.length === 0) {
        throw new AppError("Vui lòng cung cấp productId và danh sách items", 400);
      }

      const result = await this.inventoryService.addBulkInventory(
        userId,
        productId,
        items
      );

      res.status(201).json({
        success: true,
        message: `Đã thêm ${result.added} inventory items`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update inventory item
   * PUT /api/inventory/:itemId
   */
  updateInventoryItem = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { itemId } = req.params;
      const inventoryItemId = Array.isArray(itemId) ? itemId[0] : itemId;
      const { secretType, secretValue } = req.body;

      const item = await this.inventoryService.updateInventoryItem(
        userId,
        inventoryItemId,
        { secretType, secretValue }
      );

      res.status(200).json({
        success: true,
        message: "Cập nhật inventory thành công",
        data: item,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete inventory item
   * DELETE /api/inventory/:itemId
   */
  deleteInventoryItem = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { itemId } = req.params;
      const inventoryItemId = Array.isArray(itemId) ? itemId[0] : itemId;

      await this.inventoryService.deleteInventoryItem(userId, inventoryItemId);

      res.status(200).json({
        success: true,
        message: "Xóa inventory thành công",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available count for a product
   * GET /api/inventory/product/:productId/count
   */
  getAvailableCount = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { productId } = req.params;
      const prodId = Array.isArray(productId) ? productId[0] : productId;
      const count = await this.inventoryService.getAvailableCount(prodId);

      res.status(200).json({
        success: true,
        data: { availableCount: count },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const inventoryController = new InventoryController();
