"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth";
import { ChatBox } from "./ChatBox";
import { FloatingChatButton } from "./MessageNotification";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ChatProvider] ${action}`, data ?? "");
  }
};

/**
 * ChatProvider component - renders chat UI for authenticated users
 * Place this in the root layout to enable chat functionality site-wide
 */
export function ChatProvider() {
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    log("mount", { isAuthenticated, userId: user?.id });
  }, [isAuthenticated, user?.id]);

  // Don't render chat for unauthenticated users
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* Floating chat button - visible when chat is closed */}
      <FloatingChatButton />

      {/* Chat box - visible when opened */}
      <ChatBox />
    </>
  );
}

export default ChatProvider;
