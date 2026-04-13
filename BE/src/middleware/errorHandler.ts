import { Request, Response, NextFunction } from "express";
import { env } from "@/config/env";
import { MESSAGES } from "@/constants/messages";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Log unexpected errors in development only
  if (env.nodeEnv !== "production") {
    console.error("Unexpected error:", err.message);
  }

  res.status(500).json({
    success: false,
    message: env.nodeEnv === "production" ? MESSAGES.ERROR.GENERAL.INTERNAL_SERVER_ERROR : err.message,
  });
};
