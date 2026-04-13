"use client";

import { useEffect, useCallback, useState } from "react";
import { X, MessageCircle, ChevronLeft } from "lucide-react";
import { useChat, useChatStore } from "@/lib/hooks/useChat";
import { useChatMessages, useUserNotifications } from "@/lib/hooks/useSocket";
import { useAuthStore } from "@/lib/auth";
import { ConversationList } from "./ConversationList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { Conversation, Message } from "@/lib/services/chat.service";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[ChatBox] ${action}`, data ?? "");
  }
};

export function ChatBox() {
  const { user } = useAuthStore();
  const {
    conversations,
    messages,
    currentConversation,
    isOpen,
    closeChat,
    selectConversation,
    sendMessage,
    fetchConversations,
    addMessage,
    incrementUnreadCount,
  } = useChat();

  const { updateConversation, setMessages } = useChatStore();

  const [view, setView] = useState<"list" | "chat">("list");
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

  // Handle new message from socket
  const handleNewMessage = useCallback(
    (payload: any) => {
      log("handleNewMessage", payload);

      // Convert socket payload to Message format
      const newMessage: Message = {
        _id: payload.messageId,
        conversationId: payload.conversationId,
        senderUserId: payload.senderUserId,
        messageType: payload.messageType,
        body: payload.body,
        attachments: payload.attachments,
        isInternal: payload.isInternal,
        sentAt: payload.sentAt,
        readBy: [],
      };

      // If this message is for the current conversation, add it
      if (currentConversation?._id === payload.conversationId) {
        addMessage(newMessage);
      } else {
        // Increment unread count for other conversations
        incrementUnreadCount();
      }

      // Update conversation preview
      updateConversation(payload.conversationId, {
        lastMessagePreview: payload.body || "[Attachment]",
        lastMessageAt: payload.sentAt,
      });
    },
    [currentConversation, addMessage, incrementUnreadCount, updateConversation]
  );

  // Handle typing events
  const handleTypingStart = useCallback((payload: any) => {
    log("handleTypingStart", payload);
    if (payload.userId !== user?.id) {
      setTypingUsers((prev) => ({
        ...prev,
        [payload.conversationId]: payload.userName || "Someone",
      }));
    }
  }, [user?.id]);

  const handleTypingStop = useCallback((payload: any) => {
    log("handleTypingStop", payload);
    setTypingUsers((prev) => {
      const newState = { ...prev };
      delete newState[payload.conversationId];
      return newState;
    });
  }, []);

  // Subscribe to user notifications
  useUserNotifications(
    handleNewMessage,
    undefined,
    undefined
  );

  // Subscribe to current conversation messages
  useChatMessages(
    currentConversation?._id || null,
    handleNewMessage,
    undefined,
    handleTypingStart,
    handleTypingStop
  );

  // Sync view with currentConversation
  useEffect(() => {
    if (currentConversation) {
      setView("chat");
    } else {
      setView("list");
    }
  }, [currentConversation]);

  // Fetch conversations when chat opens
  useEffect(() => {
    if (isOpen && user) {
      log("chat opened, fetching conversations");
      fetchConversations();
    }
  }, [isOpen, user, fetchConversations]);

  // Handle conversation selection
  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      log("selecting conversation", conversation._id);
      await selectConversation(conversation);
      setView("chat");
    },
    [selectConversation]
  );

  // Handle back to list
  const handleBack = useCallback(() => {
    log("back to list");
    selectConversation(null);
    setView("list");
  }, [selectConversation]);

  // Handle send message
  const handleSendMessage = useCallback(
    async (body: string, attachments?: Message["attachments"]) => {
      log("sending message", { body, attachments });
      try {
        await sendMessage(body, attachments);
      } catch (err) {
        console.error("Failed to send message:", err);
      }
    },
    [sendMessage]
  );

  if (!isOpen) return null;

  const typingUser = currentConversation
    ? typingUsers[currentConversation._id]
    : null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-lg">
        <div className="flex items-center gap-2">
          {view === "chat" && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="font-semibold text-white">
            {view === "chat" && currentConversation
              ? getConversationTitle(currentConversation, user?.id)
              : "Tin nhắn"}
          </span>
        </div>
        <button
          onClick={closeChat}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === "list" ? (
          <ConversationList
            conversations={conversations || []}
            onSelect={handleSelectConversation}
            currentUserId={user?.id}
          />
        ) : (
          <MessageList
            messages={messages || []}
            currentUserId={user?.id}
            typingUser={typingUser}
          />
        )}
      </div>

      {/* Input (only in chat view) */}
      {view === "chat" && currentConversation && (
        <MessageInput
          conversationId={currentConversation._id}
          onSend={handleSendMessage}
        />
      )}
    </div>
  );
}

// Helper to get conversation title
function getConversationTitle(
  conversation: Conversation,
  currentUserId?: string
): string {
  if (conversation.type === "Support") {
    return `Ticket #${(conversation.ticketId as any)?.ticketCode || "Support"}`;
  }

  if (conversation.type === "Shop") {
    const shop = conversation.shopId as any;
    return shop?.shopName || shop?.name || "Shop";
  }

  if (conversation.type === "OrderItem") {
    // Show the other party's name
    const customer = conversation.customerUserId as any;
    const seller = conversation.sellerUserId as any;

    if (currentUserId === customer?._id) {
      return seller?.fullName || "Người bán";
    }
    return customer?.fullName || "Khách hàng";
  }

  return "Cuộc trò chuyện";
}

export default ChatBox;
