import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "@/middleware/auth";
import { UserService } from "@/services/users/user.service";
import { updateProfileSchema } from "@/validators/users/user.schema";
import { AppError } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  getProfile = async (
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

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const validatedData = updateProfileSchema.parse(req.body);

      const updatedUser = await this.userService.updateUserProfile(userId, {
        fullName: validatedData.fullName,
        phone: validatedData.phone ?? undefined,
        avatarUrl: validatedData.avatarUrl ?? undefined,
      });

      if (!updatedUser) {
        throw new AppError(MESSAGES.ERROR.USER.NOT_FOUND, 404);
      }

      res.status(200).json({
        success: true,
        message: MESSAGES.SUCCESS.PROFILE_UPDATED,
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const user = await this.userService.getUserById(userId);

      if (!user) {
        throw new AppError(MESSAGES.ERROR.USER.NOT_FOUND, 404);
      }

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get customer dashboard stats
   * GET /api/users/profile/stats
   */
  getCustomerStats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const stats = await this.userService.getCustomerStats(userId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };
}
