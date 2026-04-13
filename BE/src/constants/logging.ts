/**
 * Logging Constants and Utilities
 * Centralized logging configuration for the backend
 */

/**
 * Log levels
 */
export const LOG_LEVELS = {
  DEBUG: "DEBUG",
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
} as const;

/**
 * Log prefixes for different services/modules
 */
export const LOG_PREFIXES = {
  // Services
  ORDER_SERVICE: "[OrderService]",
  PRODUCT_SERVICE: "[ProductService]",
  SHOP_SERVICE: "[ShopService]",
  INVENTORY_SERVICE: "[InventoryService]",
  WALLET_SERVICE: "[WalletService]",
  AUTH_SERVICE: "[AuthService]",
  USER_SERVICE: "[UserService]",

  // Controllers
  ORDER_CONTROLLER: "[OrderController]",
  PRODUCT_CONTROLLER: "[ProductController]",
  SHOP_CONTROLLER: "[ShopController]",
  INVENTORY_CONTROLLER: "[InventoryController]",
  AUTH_CONTROLLER: "[AuthController]",

  // Middleware
  AUTH_MIDDLEWARE: "[AuthMiddleware]",
  ERROR_HANDLER: "[ErrorHandler]",

  // Utils
  HELPERS: "[Helpers]",
  ENCRYPTION: "[Encryption]",
} as const;

/**
 * Create a namespaced logger for a specific module
 * @param prefix - The prefix from LOG_PREFIXES
 * @returns Logger object with log, error, warn, debug methods
 */
export function createLogger(prefix: string) {
  const isDev = process.env.NODE_ENV !== "production";

  return {
    log: (...args: unknown[]) => {
      console.log(prefix, ...args);
    },
    error: (...args: unknown[]) => {
      console.error(prefix, ...args);
    },
    warn: (...args: unknown[]) => {
      console.warn(prefix, ...args);
    },
    debug: (...args: unknown[]) => {
      if (isDev) {
        console.debug(prefix, ...args);
      }
    },
    // Structured logging with timestamp
    info: (message: string, data?: Record<string, unknown>) => {
      console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: LOG_LEVELS.INFO,
        prefix,
        message,
        ...data,
      }));
    },
  };
}

/**
 * Format error for logging
 * @param error - The error to format
 * @returns Formatted error object
 */
export function formatErrorForLog(error: unknown): Record<string, unknown> {
  if (!error) {
    return { message: "Unknown error (null/undefined)" };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (typeof error === "object") {
    return error as Record<string, unknown>;
  }

  return { message: String(error) };
}
