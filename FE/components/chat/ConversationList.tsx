"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MessageSquare, Ticket, Store, Package } from "lucide-react";
import { Conversation } from "@/lib/services/chat.service";
import { cn } from "@/lib/utils";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ConversationList] ${action}`, data ?? "");
  }
};

interface ConversationListProps {
  conversations: Conversation[];
  onSelect: (conversation: Conversation) => void;
  currentUserId?: string;
}

export function ConversationList({
  conversations = [],
  onSelect,
  currentUserId,
}: ConversationListProps) {
  log("render", { count: conversations?.length ?? 0 });

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
        <MessageSquare className="w-12 h-12 mb-2 opacity-50" />
        <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation._id}
          conversation={conversation}
          onSelect={onSelect}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  onSelect: (conversation: Conversation) => void;
  currentUserId?: string;
}

function ConversationItem({
  conversation,
  onSelect,
  currentUserId,
}: ConversationItemProps) {
  const unreadCount = currentUserId
    ? (conversation.unreadCount as Record<string, number>)?.[currentUserId] || 0
    : 0;

  const title = getConversationTitle(conversation, currentUserId);
  const subtitle = getConversationSubtitle(conversation);
  const icon = getConversationIcon(conversation.type);
  const time = conversation.lastMessageAt
    ? formatDistanceToNow(new Date(conversation.lastMessageAt), {
        addSuffix: true,
        locale: vi,
      })
    : "";

  return (
    <button
      onClick={() => {
        log("select conversation", conversation._id);
        onSelect(conversation);
      }}
      className={cn(
        "w-full p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 text-left",
        unreadCount > 0 && "bg-blue-50 dark:bg-blue-900/20"
      )}
    >
      {/* Avatar/Icon */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "font-medium truncate text-gray-900 dark:text-gray-100",
              unreadCount > 0 && "font-semibold"
            )}
          >
            {title}
          </span>
          {time && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {time}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-1">
          <p
            className={cn(
              "text-sm truncate text-gray-500 dark:text-gray-400",
              unreadCount > 0 && "text-gray-700 dark:text-gray-300 font-medium"
            )}
          >
            {conversation.lastMessagePreview || subtitle}
          </p>
          {unreadCount > 0 && (
            <span className="flex-shrink-0 bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {/* Status badge */}
        {conversation.status !== "Open" && (
          <span
            className={cn(
              "inline-block mt-1 text-xs px-2 py-0.5 rounded-full",
              conversation.status === "Closed" &&
                "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
              conversation.status === "Blocked" &&
                "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
            )}
          >
            {conversation.status === "Closed" ? "Đã đóng" : "Bị chặn"}
          </span>
        )}
      </div>
    </button>
  );
}

function getConversationIcon(type: Conversation["type"]) {
  switch (type) {
    case "Support":
      return <Ticket className="w-5 h-5" />;
    case "Shop":
      return <Store className="w-5 h-5" />;
    case "OrderItem":
      return <Package className="w-5 h-5" />;
    default:
      return <MessageSquare className="w-5 h-5" />;
  }
}

function getConversationTitle(
  conversation: Conversation,
  currentUserId?: string
): string {
  if (conversation.type === "Support") {
    const ticket = conversation.ticketId as any;
    return ticket?.ticketCode
      ? `Ticket #${ticket.ticketCode}`
      : "Hỗ trợ";
  }

  if (conversation.type === "Shop") {
    const shop = conversation.shopId as any;
    return shop?.shopName || shop?.name || "Shop";
  }

  if (conversation.type === "OrderItem") {
    const customer = conversation.customerUserId as any;
    const seller = conversation.sellerUserId as any;

    if (currentUserId === customer?._id) {
      return seller?.fullName || "Người bán";
    }
    return customer?.fullName || "Khách hàng";
  }

  return "Cuộc trò chuyện";
}

function getConversationSubtitle(conversation: Conversation): string {
  if (conversation.type === "Support") {
    const ticket = conversation.ticketId as any;
    return ticket?.title || "Yêu cầu hỗ trợ";
  }

  if (conversation.type === "OrderItem") {
    return "Trao đổi về đơn hàng";
  }

  return "Nhắn tin trực tiếp";
}

export default ConversationList;
