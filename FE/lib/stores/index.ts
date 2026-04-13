/**
 * Centralized state management exports
 * All Zustand stores should be exported from here for consistent imports
 */

// Auth store
export { useAuthStore } from "../auth";

// Chat store
export { useChatStore } from "../hooks/useChat";

// Re-export types for convenience
export type { User } from "@/types";
