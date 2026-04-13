import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, IUser, Role, Shop } from "@/models";
import { env } from "@/config/env";
import { AppError } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";
import { ROLE_KEYS } from "@/constants/roles";
import { SHOP_STATUS } from "@/constants/shopStatus";

export interface LoginResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    roleKey: string;
  };
  token: string;
  refreshToken: string;
}

export class AuthService {
  async register(
    email: string,
    password: string,
    fullName: string,
    roleKey: string = ROLE_KEYS.CUSTOMER
  ): Promise<IUser> {
    // Check if user exists
    const existingUser = await User.findOne({ email, isDeleted: false });
    if (existingUser) {
      throw new AppError(MESSAGES.ERROR.AUTH.EMAIL_ALREADY_EXISTS, 400);
    }

    // Get role
    const role = await Role.findOne({ roleKey, status: "Active" });
    if (!role) {
      throw new AppError(MESSAGES.ERROR.AUTH.INVALID_ROLE, 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      roleId: role._id,
      email,
      passwordHash,
      fullName,
      status: "Active",
      emailVerified: false,
      phoneVerified: false,
      trustLevel: 0,
    });

    return user;
  }

  /**
   * Escape special regex characters in a string
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async registerSeller(
    email: string,
    password: string,
    fullName: string,
    shopName: string,
    description: string | null = null
  ): Promise<{ user: IUser; shop: any }> {
    // Check if shop name is already taken BEFORE creating the user
    const existingShopWithName = await Shop.findOne({
      shopName: { $regex: new RegExp(`^${this.escapeRegex(shopName)}$`, "i") },
      status: { $in: [SHOP_STATUS.ACTIVE, SHOP_STATUS.PENDING] },
      isDeleted: false,
    });

    if (existingShopWithName) {
      throw new AppError(MESSAGES.ERROR.SHOP.NAME_ALREADY_EXISTS, 400);
    }

    // Register user with SELLER role
    const user = await this.register(
      email,
      password,
      fullName,
      ROLE_KEYS.SELLER
    );

    // Check if shop already exists (shouldn't happen, but safety check)
    const existingShop = await Shop.findOne({
      ownerUserId: user._id,
      isDeleted: false,
    });

    if (existingShop) {
      throw new AppError(MESSAGES.ERROR.SHOP.ALREADY_EXISTS, 400);
    }

    // Create shop with provided information
    try {
      const shop = await Shop.create({
        ownerUserId: user._id,
        shopName,
        description: description || null,
        status: SHOP_STATUS.PENDING,
        ratingAvg: 0,
        totalSales: 0,
      });

      return { user, shop };
    } catch (error: unknown) {
      // If shop creation fails due to duplicate name (race condition),
      // we need to rollback the user creation
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === 11000
      ) {
        // Delete the user we just created
        await User.findByIdAndDelete(user._id);
        throw new AppError(MESSAGES.ERROR.SHOP.NAME_ALREADY_EXISTS, 400);
      }
      // For other errors, also rollback user creation
      await User.findByIdAndDelete(user._id);
      throw error;
    }
  }

  async login(email: string, password: string): Promise<LoginResult> {
    try {
      // Find user
      const user = await User.findOne({ email, isDeleted: false }).populate(
        "roleId"
      );
      if (!user) {
        throw new AppError(MESSAGES.ERROR.AUTH.INVALID_EMAIL_OR_PASSWORD, 401);
      }

      // Check if roleId is populated
      if (!user.roleId || typeof user.roleId === "string") {
        throw new AppError(MESSAGES.ERROR.AUTH.USER_ROLE_NOT_FOUND, 500);
      }

      // Check status
      if (user.status !== "Active") {
        throw new AppError(MESSAGES.ERROR.AUTH.ACCOUNT_LOCKED_OR_BANNED, 403);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError(MESSAGES.ERROR.AUTH.INVALID_EMAIL_OR_PASSWORD, 401);
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

      // Generate tokens
      const roleKey = (user.roleId as any).roleKey;
      if (!roleKey) {
        throw new AppError(MESSAGES.ERROR.AUTH.USER_ROLE_CONFIG_ERROR, 500);
      }

      const token = this.generateToken(user._id.toString(), user.email, roleKey);
      const refreshToken = this.generateRefreshToken(
        user._id.toString(),
        user.email
      );

      return {
        user: {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          roleKey,
        },
        token,
        refreshToken,
      };
    } catch (error) {
      // Re-throw AppError as-is
      if (error instanceof AppError) {
        throw error;
      }
      
      // Wrap other errors
      throw new AppError(
        error instanceof Error ? error.message : MESSAGES.ERROR.AUTH.LOGIN_FAILED,
        500
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      const decoded = jwt.verify(
        refreshToken,
        env.jwtRefreshSecret
      ) as { userId: string; email: string };

      const user = await User.findById(decoded.userId).populate("roleId");
      if (!user || user.isDeleted || user.status !== "Active") {
        throw new AppError(MESSAGES.ERROR.AUTH.INVALID_REFRESH_TOKEN, 401);
      }

      const roleKey = (user.roleId as any).roleKey;
      const token = this.generateToken(user._id.toString(), user.email, roleKey);

      return { token };
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(MESSAGES.ERROR.AUTH.INVALID_REFRESH_TOKEN, 401);
    }
  }

  private generateToken(userId: string, email: string, roleKey: string): string {
    const payload = { userId, email, roleKey };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpire } as any);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await User.findById(userId);
    if (!user || user.isDeleted) {
      throw new AppError(MESSAGES.ERROR.USER.NOT_FOUND, 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(MESSAGES.ERROR.AUTH.CURRENT_PASSWORD_INCORRECT, 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.findByIdAndUpdate(userId, { passwordHash: newPasswordHash });
  }

  private generateRefreshToken(userId: string, email: string): string {
    const payload = { userId, email };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpire } as any);
  }
}
