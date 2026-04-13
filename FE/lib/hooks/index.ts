/**
 * Centralized hooks exports
 * All custom hooks should be exported from here for consistent imports
 */

// Product hooks
export { useProducts, useFeaturedProducts, useTopProducts } from "./useProducts";
export type { UseProductsOptions } from "./useProducts";

// Chat hooks
export {
  useChat,
  useConversations,
  useMessages,
  useUnreadCount,
  useChatBox,
  useTickets,
  useChatStore,
} from "./useChat";

// Shop hooks
export { useShop } from "./useShop";

// Permission hooks
export { usePermissions } from "./usePermissions";

// Socket hooks
export { useSocket } from "./useSocket";
