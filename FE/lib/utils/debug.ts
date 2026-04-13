/**
 * Debug Utilities
 * Centralized logging utilities for debugging across the application
 */

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

/**
 * Create a namespaced logger for a specific module/component
 * @param prefix - The prefix to use for log messages (e.g., "[Products]", "[OrderService]")
 * @returns Logger object with log, error, warn methods
 */
export function createLogger(prefix: string) {
  return {
    log: (...args: unknown[]) => {
      if (isDev) {
        console.log(prefix, ...args);
      }
    },
    error: (...args: unknown[]) => {
      // Always log errors, even in production
      console.error(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      if (isDev) {
        console.warn(prefix, ...args);
      }
    },
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
  };
}

/**
 * Format an error object for logging
 * Handles various error types including AxiosError, Error, and plain objects
 * @param error - The error to format
 * @returns Formatted error object with all relevant details
 */
export function formatError(error: unknown): Record<string, unknown> {
  if (!error) {
    return { message: "Unknown error (null/undefined)" };
  }

  // Handle plain objects (like ApiError from apiClient)
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;

    return {
      message: err.message || "Unknown error",
      status: err.status,
      code: err.code,
      name: err.name,
      // For Axios errors
      response: err.response ? {
        status: (err.response as any)?.status,
        statusText: (err.response as any)?.statusText,
        data: (err.response as any)?.data,
      } : undefined,
      // Stack trace
      stack: err.stack,
      // Raw serialization (catches all enumerable and non-enumerable properties)
      raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
    };
  }

  // Handle string errors
  if (typeof error === "string") {
    return { message: error };
  }

  return { message: String(error) };
}

/**
 * Log levels for structured logging
 */
export const LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

/**
 * Common log prefixes for different modules
 */
export const LOG_PREFIXES = {
  // Pages
  PRODUCTS: "[Products]",
  SELLER_ORDERS: "[SellerOrders]",
  CART: "[Cart]",
  CHECKOUT: "[Checkout]",

  // Services
  API: "[API]",
  AUTH: "[Auth]",
  ORDER_SERVICE: "[OrderService]",
  PRODUCT_SERVICE: "[ProductService]",
  INVENTORY_SERVICE: "[InventoryService]",

  // Components
  AUTH_PROVIDER: "[AuthProvider]",
  REQUIRE_AUTH: "[RequireAuth]",
} as const;
