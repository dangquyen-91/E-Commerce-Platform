import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { User } from "@/models";
import { MESSAGES } from "@/constants/messages";
import { USER_STATUS } from "@/constants/roles";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    roleId: string;
    roleKey: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Try to get token from Authorization header first, then from cookie
    const token = 
      req.headers.authorization?.replace("Bearer ", "") || 
      req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ success: false, message: MESSAGES.ERROR.AUTH.NO_TOKEN });
      return;
    }

    const decoded = jwt.verify(token, env.jwtSecret) as {
      userId: string;
      email: string;
    };

    const user = await User.findById(decoded.userId)
      .populate("roleId")
      .select("-passwordHash");

    if (!user || user.isDeleted || user.status !== USER_STATUS.ACTIVE) {
      res.status(401).json({ success: false, message: MESSAGES.ERROR.AUTH.USER_NOT_FOUND_OR_INACTIVE });
      return;
    }

    // roleId is populated, so we need to extract _id from the populated object
    const populatedRole = user.roleId as any;
    req.user = {
      id: user._id.toString(),
      email: user.email,
      roleId: populatedRole._id.toString(),
      roleKey: populatedRole.roleKey,
    };

    next();
  } catch {
    res.status(401).json({ success: false, message: MESSAGES.ERROR.AUTH.INVALID_TOKEN });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: MESSAGES.ERROR.AUTH.UNAUTHORIZED });
      return;
    }

    if (!allowedRoles.includes(req.user.roleKey)) {
      res.status(403).json({ 
        success: false, 
        message: MESSAGES.ERROR.AUTH.FORBIDDEN 
      });
      return;
    }

    next();
  };
};
