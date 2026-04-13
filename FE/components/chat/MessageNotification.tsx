"use client";

import { useEffect, useCallback } from "react";
import { MessageCircle, Bell } from "lucide-react";
import { useUnreadCount, useChatBox } from "@/lib/hooks/useChat";
import { useUserNotifications } from "@/lib/hooks/useSocket";
import { useAuthStore } from "@/lib/auth";
import { cn } from "@/lib/utils";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[MessageNotification] ${action}`, data ?? "");
  }
};

interface MessageNotificationProps {
  className?: string;
  variant?: "icon" | "button";
  showLabel?: boolean;
}

export function MessageNotification({
  className,
  variant = "icon",
  showLabel = false,
}: MessageNotificationProps) {
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount, incrementUnreadCount } = useUnreadCount();
  const { isOpen, toggleChat } = useChatBox();

  log("render", { unreadCount, isOpen });

  // Handle new message notification
  const handleNewMessage = useCallback(
    (payload: any) => {
      log("new message received", payload);
      // Only increment if chat is not open or message is from different conversation
      if (!isOpen) {
        incrementUnreadCount();

        // Show browser notification if supported and permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Tin nhắn mới", {
            body: payload.body || "Bạn có tin nhắn mới",
            icon: "/logo.png",
            tag: "chat-notification",
          });
        }
      }
    },
    [isOpen, incrementUnreadCount]
  );

  // Subscribe to user notifications
  useUserNotifications(handleNewMessage, undefined, undefined);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((permission) => {
        log("notification permission", permission);
      });
    }
  }, []);

  // Fetch unread count on mount
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  const handleClick = () => {
    log("clicked, toggling chat");
    toggleChat();
  };

  if (!user) return null;

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={cn(
          "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
          "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40",
          "text-blue-600 dark:text-blue-400",
          isOpen && "bg-blue-100 dark:bg-blue-900/40",
          className
        )}
      >
        <MessageCircle className="w-5 h-5" />
        {showLabel && <span className="text-sm font-medium">Tin nhắn</span>}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-medium animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "relative p-2 rounded-full transition-colors",
        "hover:bg-gray-100 dark:hover:bg-gray-800",
        "text-gray-600 dark:text-gray-400",
        isOpen && "bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400",
        className
      )}
      title="Tin nhắn"
    >
      <MessageCircle className="w-6 h-6" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium animate-pulse">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

/**
 * Floating chat button - shows in bottom right corner
 */
export function FloatingChatButton() {
  const { user } = useAuthStore();
  const { unreadCount, fetchUnreadCount, incrementUnreadCount } = useUnreadCount();
  const { isOpen, toggleChat, openChat } = useChatBox();

  log("FloatingChatButton render", { unreadCount, isOpen });

  // Handle new message notification
  const handleNewMessage = useCallback(
    (payload: any) => {
      log("FloatingChatButton new message", payload);
      if (!isOpen) {
        incrementUnreadCount();
      }
    },
    [isOpen, incrementUnreadCount]
  );

  // Subscribe to notifications
  useUserNotifications(handleNewMessage, undefined, undefined);

  // Fetch unread count on mount
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  if (!user || isOpen) return null;

  return (
    <button
      onClick={openChat}
      className={cn(
        "fixed bottom-4 right-4 z-40",
        "w-14 h-14 rounded-full",
        "bg-gradient-to-r from-blue-500 to-blue-600",
        "hover:from-blue-600 hover:to-blue-700",
        "shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all duration-200",
        "text-white"
      )}
      title="Mở chat"
    >
      <MessageCircle className="w-7 h-7" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1 font-bold shadow-md">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}

export default MessageNotification;
