import { PlatformCatalog } from "@/models";
import type { IPlatformCatalog } from "@/models/products/platform-catalog.model";
import { AppError } from "@/middleware/errorHandler";
import type {
  CreatePlatformCatalogInput,
  UpdatePlatformCatalogInput,
} from "@/validators/products/platform-catalog.schema";

export class PlatformCatalogService {
  /**
   * Get all platform catalogs
   */
  async getAll(includeHidden = false): Promise<IPlatformCatalog[]> {
    const filter = includeHidden ? {} : { status: "Active" };
    return PlatformCatalog.find(filter).sort({ platformName: 1 });
  }

  /**
   * Get platform catalog by ID
   */
  async getById(id: string): Promise<IPlatformCatalog | null> {
    return PlatformCatalog.findById(id);
  }

  /**
   * Create a new platform catalog
   */
  async create(
    input: CreatePlatformCatalogInput,
    logoUrl?: string | null
  ): Promise<IPlatformCatalog> {
    // Check if platform name already exists
    const existing = await PlatformCatalog.findOne({
      platformName: { $regex: new RegExp(`^${input.platformName}$`, "i") },
    });

    if (existing) {
      throw new AppError("Platform name already exists", 400);
    }

    return PlatformCatalog.create({
      platformName: input.platformName,
      logoUrl: logoUrl || null,
      status: input.status || "Active",
    });
  }

  /**
   * Update a platform catalog
   */
  async update(
    id: string,
    input: UpdatePlatformCatalogInput,
    logoUrl?: string | null
  ): Promise<IPlatformCatalog> {
    const platform = await PlatformCatalog.findById(id);

    if (!platform) {
      throw new AppError("Platform not found", 404);
    }

    // Check name uniqueness if changing name
    if (input.platformName && input.platformName !== platform.platformName) {
      const existing = await PlatformCatalog.findOne({
        platformName: { $regex: new RegExp(`^${input.platformName}$`, "i") },
        _id: { $ne: id },
      });

      if (existing) {
        throw new AppError("Platform name already exists", 400);
      }
    }

    const updateData: Partial<IPlatformCatalog> = {};

    if (input.platformName) updateData.platformName = input.platformName;
    if (input.status) updateData.status = input.status;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

    const updated = await PlatformCatalog.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updated) {
      throw new AppError("Failed to update platform", 500);
    }

    return updated;
  }

  /**
   * Delete a platform catalog
   */
  async delete(id: string): Promise<void> {
    const platform = await PlatformCatalog.findById(id);

    if (!platform) {
      throw new AppError("Platform not found", 404);
    }

    // TODO: Check if any products are using this platform before deleting

    await PlatformCatalog.findByIdAndDelete(id);
  }
}

export const platformCatalogService = new PlatformCatalogService();
