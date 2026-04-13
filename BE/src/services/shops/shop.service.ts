import { BaseService } from "@/services/base.service";
import { Shop, IShop, User, Role, KycSession } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";
import { SHOP_STATUS } from "@/constants/shopStatus";
import { ROLE_KEYS } from "@/constants/roles";

export class ShopService extends BaseService<IShop> {
  constructor() {
    super(Shop);
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Check if a shop name is already taken by an Active or Pending shop
   * @param shopName - The shop name to check
   * @param excludeShopId - Optional shop ID to exclude (for updates)
   * @returns true if the name is taken, false otherwise
   */
  async isShopNameTaken(
    shopName: string,
    excludeShopId?: string
  ): Promise<boolean> {
    const query: Record<string, unknown> = {
      shopName: { $regex: new RegExp(`^${this.escapeRegex(shopName)}$`, "i") }, // Case-insensitive match
      status: { $in: [SHOP_STATUS.ACTIVE, SHOP_STATUS.PENDING] },
      isDeleted: false,
    };

    if (excludeShopId) {
      query._id = { $ne: excludeShopId };
    }

    const existingShop = await Shop.findOne(query);
    return existingShop !== null;
  }

  async createShop(
    ownerUserId: string,
    shopName: string,
    description?: string
  ): Promise<IShop> {
    const kycSession = await KycSession.findOne({ userId: ownerUserId });
    if (!kycSession || kycSession.status !== "VERIFIED") {
      throw new AppError("Bạn cần xác thực eKYC thành công trước khi tạo shop.", 403);
    }

    // Check if user already has a shop (any status)
    const existingShop = await Shop.findOne({ ownerUserId });

    if (existingShop) {
      // If shop is active, pending, or suspended and not deleted - block
      if (
        !existingShop.isDeleted &&
        ["Pending", "Active", "Suspended"].includes(existingShop.status)
      ) {
        const statusMessage =
          existingShop.status === "Pending"
            ? "đang chờ duyệt"
            : existingShop.status === "Active"
            ? "đang hoạt động"
            : "đang bị tạm ngưng";
        throw new AppError(
          `Bạn đã có shop ${statusMessage}. Vui lòng kiểm tra trạng thái shop của bạn.`,
          400
        );
      }

      // Check if the NEW shop name is already taken (for re-registration)
      if (await this.isShopNameTaken(shopName)) {
        throw new AppError(MESSAGES.ERROR.SHOP.NAME_ALREADY_EXISTS, 400);
      }

      // If shop was rejected (Closed + isDeleted), allow re-registration by updating the old record
      // This avoids duplicate key error on ownerUserId unique index
      try {
        const updatedShop = await Shop.findByIdAndUpdate(
          existingShop._id,
          {
            shopName,
            description: description || null,
            status: "Pending",
            isDeleted: false,
            approvedByUserId: null,
            approvedAt: null,
            moderatorNote: null,
          },
          { new: true }
        );

        return updatedShop!;
      } catch (error: unknown) {
        // Handle MongoDB duplicate key error (race condition fallback)
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === 11000
        ) {
          throw new AppError(MESSAGES.ERROR.SHOP.NAME_ALREADY_EXISTS, 400);
        }
        throw error;
      }
    }

    // Check if shop name is already taken (for first-time registration)
    if (await this.isShopNameTaken(shopName)) {
      throw new AppError(MESSAGES.ERROR.SHOP.NAME_ALREADY_EXISTS, 400);
    }

    // Verify user exists
    const user = await User.findById(ownerUserId);
    if (!user || user.isDeleted) {
      throw new AppError(MESSAGES.ERROR.USER.NOT_FOUND, 404);
    }

    // Create new shop (first time registration)
    try {
      const shop = await Shop.create({
        ownerUserId,
        shopName,
        description: description || null,
        status: "Pending",
        ratingAvg: 0,
        totalSales: 0,
      });

      return shop;
    } catch (error: unknown) {
      // Handle MongoDB duplicate key error (race condition fallback)
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new AppError(MESSAGES.ERROR.SHOP.NAME_ALREADY_EXISTS, 400);
      }
      throw error;
    }
  }

  async getShopByOwnerId(ownerUserId: string): Promise<IShop | null> {
    // Include rejected shops (status: Closed, isDeleted: true) so user can see rejection reason
    return this.model
      .findOne({
        ownerUserId,
        $or: [
          { isDeleted: false },
          { isDeleted: true, status: "Closed" }, // Rejected shops
        ],
      })
      .populate("ownerUserId")
      .populate("approvedByUserId");
  }

  async approveShop(
    shopId: string,
    approvedByUserId: string,
    moderatorNote?: string
  ): Promise<IShop | null> {
    const shop = await this.model.findByIdAndUpdate(
      shopId,
      {
        status: "Active",
        approvedByUserId,
        approvedAt: new Date(),
        moderatorNote: moderatorNote || null,
      },
      { new: true }
    );

    if (!shop) {
      throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
    }

    // OPTION A: After shop is approved, upgrade the shop owner role to SELLER
    const sellerRole = await Role.findOne({
      roleKey: ROLE_KEYS.SELLER,
      status: "Active",
    });

    if (!sellerRole) {
      throw new AppError("Seller role not found or inactive", 500);
    }

    await User.findByIdAndUpdate(shop.ownerUserId, {
      roleId: sellerRole._id,
    });

    return shop;
  }

  async rejectShop(
    shopId: string,
    _moderatorUserId: string,
    moderatorNote?: string
  ): Promise<IShop | null> {
    const shop = await this.model.findByIdAndUpdate(
      shopId,
      {
        status: "Closed",
        approvedByUserId: null,
        approvedAt: null,
        moderatorNote: moderatorNote || null,
        isDeleted: true, // Soft delete để user có thể đăng ký lại
      },
      { new: true }
    );

    if (!shop) {
      throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
    }

    return shop;
  }

  async getPendingShops(): Promise<any[]> {
    try {
      const shops = await this.model
        .find({ status: "Pending", isDeleted: false })
        .populate({
          path: "ownerUserId",
          select: "_id email fullName",
          match: { isDeleted: false }, // Only populate if user is not deleted
        })
        .populate({
          path: "approvedByUserId",
          select: "_id email fullName",
        })
        .sort({ createdAt: -1 })
        .lean(); // Use lean() for better performance and to avoid Mongoose document issues

      // Filter out shops where ownerUserId is null (user was deleted)
      const validShops = shops.filter((shop: any) => {
        return shop.ownerUserId !== null && shop.ownerUserId !== undefined;
      });

      return validShops;
    } catch (error) {
      throw error;
    }
  }

  async updateShopStatus(
    shopId: string,
    status: "Active" | "Suspended" | "Closed"
  ): Promise<IShop | null> {
    const shop = await this.model.findByIdAndUpdate(
      shopId,
      { status },
      { new: true }
    );

    if (!shop) {
      throw new AppError(MESSAGES.ERROR.SHOP.NOT_FOUND, 404);
    }

    return shop;
  }

  async updateShopRating(shopId: string, newRating: number): Promise<void> {
    await this.model.findByIdAndUpdate(shopId, {
      $set: { ratingAvg: newRating },
    });
  }

  async incrementSales(shopId: string, amount: number): Promise<void> {
    await this.model.findByIdAndUpdate(shopId, {
      $inc: { totalSales: amount },
    });
  }
}
