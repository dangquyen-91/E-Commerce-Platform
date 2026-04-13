"use client";

import { useState, useCallback } from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth";
import { useChat, useChatBox } from "@/lib/hooks/useChat";
import { chatService } from "@/lib/services/chat.service";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ChatWithShopButton] ${action}`, data ?? "");
  }
};

interface ChatWithShopButtonProps {
  shopId: string;
  sellerUserId?: string; // ID của chủ shop để chặn tự chat
  shopName?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
  disabled?: boolean;
}

export function ChatWithShopButton({
  shopId,
  sellerUserId,
  shopName,
  variant = "outline",
  size = "default",
  className,
  showLabel = true,
}: ChatWithShopButtonProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { openChat } = useChatBox();
  const { selectConversation, fetchConversations } = useChat();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const isOwnShop = user?.id === sellerUserId;

  const handleClick = useCallback(async () => {
    log("clicked", { shopId, shopName, isAuthenticated, sellerUserId });

    if (isOwnShop) {
      toast.error("Bạn không thể chat với shop của chính mình");
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated || !user) {
      log("not authenticated, redirecting to login");
      toast.info("Vui lòng đăng nhập để chat với shop");
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setIsLoading(true);

    try {
      // Create or get existing conversation with shop
      log("creating conversation with shop", shopId);
      const conversation = await chatService.createConversation({
        type: "Shop",
        shopId,
      });

      log("conversation created/found", conversation._id);

      // Refresh conversations list
      await fetchConversations();

      // Select this conversation and open chat
      await selectConversation(conversation);
      openChat();

      toast.success(`Đang mở chat với ${shopName || "shop"}`);
    } catch (err) {
      log("error creating conversation", err);
      const message = err instanceof Error ? err.message : "Không thể mở chat";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, shopName, isAuthenticated, user, router, fetchConversations, selectConversation, openChat]);

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn("gap-2", className)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <MessageCircle className="w-4 h-4" />
      )}
      {showLabel && (
        <span>{isLoading ? "Đang mở..." : "Chat với Shop"}</span>
      )}
    </Button>
  );
}

export default ChatWithShopButton;
