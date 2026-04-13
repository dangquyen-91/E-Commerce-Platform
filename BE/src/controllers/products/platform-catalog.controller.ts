import { Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { platformCatalogService } from "@/services/products/platform-catalog.service";
import {
  createPlatformCatalogSchema,
  updatePlatformCatalogSchema,
} from "@/validators/products/platform-catalog.schema";

// Helper to safely get string from params
const getParamString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

export class PlatformCatalogController {
  /**
   * Get all platform catalogs
   * GET /api/platform-catalogs
   */
  getAll = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Admin can see hidden platforms
      const includeHidden = req.user?.roleKey === "ADMIN";
      const platforms = await platformCatalogService.getAll(includeHidden);

      res.status(200).json({
        success: true,
        data: platforms,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get platform catalog by ID
   * GET /api/platform-catalogs/:id
   */
  getById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getParamString(req.params.id);
      const platform = await platformCatalogService.getById(id);

      if (!platform) {
        res.status(404).json({
          success: false,
          message: "Platform not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: platform,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new platform catalog
   * POST /api/platform-catalogs
   */
  create = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const input = createPlatformCatalogSchema.parse(req.body);

      const platform = await platformCatalogService.create(input, input.logoUrl);

      res.status(201).json({
        success: true,
        message: "Platform created successfully",
        data: platform,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a platform catalog
   * PUT /api/platform-catalogs/:id
   */
  update = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getParamString(req.params.id);
      const input = updatePlatformCatalogSchema.parse(req.body);

      const platform = await platformCatalogService.update(id, input, input.logoUrl);

      res.status(200).json({
        success: true,
        message: "Platform updated successfully",
        data: platform,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a platform catalog
   * DELETE /api/platform-catalogs/:id
   */
  delete = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = getParamString(req.params.id);
      await platformCatalogService.delete(id);

      res.status(200).json({
        success: true,
        message: "Platform deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

export const platformCatalogController = new PlatformCatalogController();
