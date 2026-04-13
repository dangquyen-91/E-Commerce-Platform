import rateLimit from "express-rate-limit";
import { env } from "@/config/env";
import { MESSAGES } from "@/constants/messages";

export const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMaxRequests,
  message: {
    success: false,
    message: MESSAGES.ERROR.GENERAL.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
   // 5 requests per window
  message: {
    success: false,
    message: MESSAGES.ERROR.GENERAL.TOO_MANY_AUTH_ATTEMPTS,
  },
});

export const conversationLimiter = rateLimit({
  windowMs: 20 * 60 * 1000, // 20 minutes
  max: 20,
  message: {
    success: false,
    message: "Bạn đã tạo quá nhiều cuộc trò chuyện. Vui lòng thử lại sau 20 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const messageLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30,
  message: {
    success: false,
    message: "Bạn đã gửi tin nhắn quá nhanh. Vui lòng thử lại sau 10 phút.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
