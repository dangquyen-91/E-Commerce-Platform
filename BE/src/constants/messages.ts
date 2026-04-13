/**
 * System-wide Messages Constants
 * Tất cả các thông báo trong hệ thống (error, success, validation) được tập trung tại đây
 * để đảm bảo tính nhất quán và dễ quản lý
 */

export const MESSAGES = {
  // Success Messages
  SUCCESS: {
    USER_REGISTERED: "User registered successfully",
    SELLER_REGISTERED: "Seller registered successfully",
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    PASSWORD_CHANGED: "Password changed successfully",
    PROFILE_UPDATED: "Profile updated successfully",
    SHOP_CREATED: "Shop created successfully",
    SHOP_UPDATED: "Shop updated successfully",
    SHOP_APPROVED: "Shop approved successfully",
    SHOP_REJECTED: "Shop rejected successfully",
    PRODUCT_CREATED: "Product created successfully, pending approval",
  },

  // Error Messages - Authentication
  ERROR: {
    AUTH: {
      NO_TOKEN: "No token provided",
      INVALID_TOKEN: "Invalid token",
      UNAUTHORIZED: "Unauthorized",
      FORBIDDEN: "Forbidden - Insufficient permissions",
      USER_NOT_FOUND_OR_INACTIVE: "User not found or inactive",
      EMAIL_ALREADY_EXISTS: "Email already exists",
      INVALID_EMAIL_OR_PASSWORD: "Invalid email or password",
      ACCOUNT_LOCKED_OR_BANNED: "Account is locked or banned",
      REFRESH_TOKEN_REQUIRED: "Refresh token is required",
      INVALID_REFRESH_TOKEN: "Invalid refresh token",
      CURRENT_PASSWORD_INCORRECT: "Current password is incorrect",
      USER_ROLE_NOT_FOUND: "User role not found",
      USER_ROLE_CONFIG_ERROR: "User role configuration error",
      INVALID_ROLE: "Invalid role",
      LOGIN_FAILED: "Login failed",
    },

    // Error Messages - User
    USER: {
      NOT_FOUND: "User not found",
      TRUST_LEVEL_INVALID: "Trust level must be between 0 and 100",
    },

    // Error Messages - Shop
    SHOP: {
      NOT_FOUND: "Shop not found",
      ALREADY_EXISTS: "User already has a shop",
      ACCESS_DENIED: "Access denied",
      NAME_ALREADY_EXISTS: "Tên shop đã tồn tại. Vui lòng chọn tên khác.",
    },

    // Error Messages - Product
    PRODUCT: {
      NOT_FOUND: "Product not found",
      SHOP_NOT_FOUND_OR_ACCESS_DENIED: "Shop not found or access denied",
      PLATFORM_NOT_FOUND: "Platform not found",
    },

    // Error Messages - General
    GENERAL: {
      ROUTE_NOT_FOUND: "Route not found",
      INTERNAL_SERVER_ERROR: "Internal server error",
      TOO_MANY_REQUESTS: "Too many requests from this IP, please try again later.",
      TOO_MANY_AUTH_ATTEMPTS: "Too many authentication attempts, please try again later.",
    },
  },
} as const;

// Re-export validation messages for convenience
export { VALIDATION_MESSAGES } from "../validators/validation-messages";
