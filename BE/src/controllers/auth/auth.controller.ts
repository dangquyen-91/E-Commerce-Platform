import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { AuthService } from "@/services/auth/auth.service";
import { UserService } from "@/services/users/user.service";
import { registerSchema, loginSchema, changePasswordSchema, registerSellerSchema } from "@/validators/auth/auth.schema";
import { AppError } from "@/middleware/errorHandler";
import { env } from "@/config/env";
import { MESSAGES } from "@/constants/messages";
import { ROLE_KEYS } from "@/constants/roles";

export class AuthController {
  private authService: AuthService;
  private userService: UserService;

  constructor() {
    this.authService = new AuthService();
    this.userService = new UserService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const validatedData = registerSchema.parse(req.body);

      // Create user
      const user = await this.authService.register(
        validatedData.email,
        validatedData.password,
        validatedData.fullName,
        ROLE_KEYS.CUSTOMER // Default role
      );

      res.status(201).json({
        success: true,
        message: MESSAGES.SUCCESS.USER_REGISTERED,
        data: {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  registerSeller = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate input - includes shopName and description
      const validatedData = registerSellerSchema.parse(req.body);

      // Create user with SELLER role and shop
      const { shop } = await this.authService.registerSeller(
        validatedData.email,
        validatedData.password,
        validatedData.fullName,
        validatedData.shopName,
        validatedData.description || null
      );

      // Convert shop to plain object and format for response
      const shopObj = shop.toObject ? shop.toObject() : shop;
      
      // Return shop data in the format expected by frontend
      res.status(201).json({
        success: true,
        message: MESSAGES.SUCCESS.SHOP_CREATED,
        data: {
          ownerUserId: shopObj.ownerUserId?.toString() || shopObj.ownerUserId,
          shopName: shopObj.shopName,
          description: shopObj.description || null,
          payoutMethod: shopObj.payoutMethod || null,
          payoutAccount: shopObj.payoutAccount || null,
          status: shopObj.status,
          approvedByUserId: shopObj.approvedByUserId
            ? shopObj.approvedByUserId.toString()
            : null,
          approvedAt: shopObj.approvedAt
            ? (shopObj.approvedAt instanceof Date
                ? shopObj.approvedAt.toISOString()
                : new Date(shopObj.approvedAt).toISOString())
            : null,
          moderatorNote: shopObj.moderatorNote || null,
          ratingAvg: shopObj.ratingAvg || 0,
          totalSales: shopObj.totalSales || 0,
          isDeleted: shopObj.isDeleted || false,
          _id: shopObj._id?.toString() || shopObj._id,
          createdAt: shopObj.createdAt instanceof Date
            ? shopObj.createdAt.toISOString()
            : new Date(shopObj.createdAt).toISOString(),
          updatedAt: shopObj.updatedAt instanceof Date
            ? shopObj.updatedAt.toISOString()
            : new Date(shopObj.updatedAt).toISOString(),
          __v: shopObj.__v || 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const validatedData = loginSchema.parse(req.body);

      // Login
      const result = await this.authService.login(
        validatedData.email,
        validatedData.password
      );

      // Set cookies
      // Parse JWT expire time (e.g., "7d" -> milliseconds)
      const parseJwtExpire = (expire: string): number => {
        const match = expire.match(/^(\d+)([dhms])$/);
        if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
        
        const value = parseInt(match[1], 10);
        const unit = match[2];
        
        switch (unit) {
          case "d": return value * 24 * 60 * 60 * 1000;
          case "h": return value * 60 * 60 * 1000;
          case "m": return value * 60 * 1000;
          case "s": return value * 1000;
          default: return 7 * 24 * 60 * 60 * 1000;
        }
      };

      // Access token cookie
      const accessTokenMaxAge = parseJwtExpire(env.jwtExpire);
      const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
      
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: isProduction, // Use HTTPS in production
        sameSite: isProduction ? "none" : "lax", // "none" for cross-site in production, "lax" for same-site
        maxAge: accessTokenMaxAge,
        path: "/",
      });

      // Refresh token cookie (expires in 30 days)
      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      });

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.LOGIN_SUCCESS,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const refreshToken =
        req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        throw new AppError(MESSAGES.ERROR.AUTH.REFRESH_TOKEN_REQUIRED, 400);
      }

      const result = await this.authService.refreshToken(refreshToken);

      // Parse JWT expire time (e.g., "7d" -> milliseconds)
      const parseJwtExpire = (expire: string): number => {
        const match = expire.match(/^(\d+)([dhms])$/);
        if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days
        
        const value = parseInt(match[1], 10);
        const unit = match[2];
        
        switch (unit) {
          case "d": return value * 24 * 60 * 60 * 1000;
          case "h": return value * 60 * 60 * 1000;
          case "m": return value * 60 * 1000;
          case "s": return value * 1000;
          default: return 7 * 24 * 60 * 60 * 1000;
        }
      };

      // Set new access token cookie
      const accessTokenMaxAge = parseJwtExpire(env.jwtExpire);
      const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
      
      res.cookie("accessToken", result.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        maxAge: accessTokenMaxAge,
        path: "/",
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Clear both access token and refresh token cookies
      const isProduction = process.env.NODE_ENV === "production" || !!process.env.VERCEL;
      
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        path: "/",
      });
      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.LOGOUT_SUCCESS,
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new AppError(MESSAGES.ERROR.USER.NOT_FOUND, 404);
      }

      // Prevent caching of authentication responses
      // This ensures the browser always checks with the server
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");

      res.status(200).json({
        success: true,
        data: {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          roleKey: (user.roleId as any).roleKey,
          roleName: (user.roleId as any).roleName,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          trustLevel: user.trustLevel,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = changePasswordSchema.parse(req.body);

      await this.authService.changePassword(
        userId,
        validatedData.currentPassword,
        validatedData.newPassword
      );

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
      });
    } catch (error) {
      next(error);
    }
  };
}
