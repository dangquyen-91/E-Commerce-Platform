"use client";

import { create } from "zustand";
import { useCallback, useEffect, useState } from "react";
import { chatService, Conversation, Message, Ticket } from "@/lib/services/chat.service";
import { useAuthStore } from "@/lib/auth";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[useChat] ${action}`, data ?? "");
  }
};

// ==================== Chat Store ====================

interface ChatState {
  // State
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, data: Partial<Conversation>) => void;
  setCurrentConversation: (conversation: Conversation | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  removeMessage: (messageId: string) => void;
  setUnreadCount: (count: number) => void;
  incrementUnreadCount: () => void;
  decrementUnreadCount: (amount?: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  messages: [],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  error: null,

  // Actions
  setConversations: (conversations) => set({ conversations }),
  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),
  updateConversation: (id, data) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c._id === id ? { ...c, ...data } : c
      ),
      currentConversation:
        state.currentConversation?._id === id
          ? { ...state.currentConversation, ...data }
          : state.currentConversation,
    })),
  setCurrentConversation: (conversation) => set({ currentConversation: conversation }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      // Prevent duplicate messages by checking _id
      const exists = state.messages.find((m) => m._id === message._id);
      if (exists) return state;
      return {
      messages: [...state.messages, message],
      };
    }),
  removeMessage: (messageId) =>
    set((state) => ({
      messages: state.messages.filter((m) => m._id !== messageId),
    })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),
  decrementUnreadCount: (amount = 1) =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - amount) })),
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      unreadCount: 0,
      isOpen: false,
      isLoading: false,
      error: null,
    }),
}));

// ==================== Custom Hooks ====================

/**
 * Hook to manage chat conversations
 */
export function useConversations() {
  const {
    conversations,
    setConversations,
    addConversation,
    updateConversation,
    setIsLoading,
    setError,
    isLoading,
    error,
  } = useChatStore();

  const fetchConversations = useCallback(async () => {
    log("fetchConversations");
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatService.getConversations();
      log("fetchConversations response", response);
      setConversations(response.conversations);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch conversations";
      setError(message);
      log("fetchConversations error", message);
    } finally {
      setIsLoading(false);
    }
  }, [setConversations, setIsLoading, setError]);

  const createConversation = useCallback(
    async (type: "OrderItem" | "Shop" | "Support", params: { shopId?: string; orderItemId?: string }) => {
      log("createConversation", { type, params });
      setIsLoading(true);
      setError(null);
      try {
        const conversation = await chatService.createConversation({
          type,
          ...params,
        });
        addConversation(conversation);
        return conversation;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create conversation";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [addConversation, setIsLoading, setError]
  );

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    createConversation,
    updateConversation,
  };
}

/**
 * Hook to manage messages in current conversation
 */
export function useMessages() {
  const {
    messages,
    currentConversation,
    setMessages,
    addMessage,
    removeMessage,
    setCurrentConversation,
    setIsLoading,
    setError,
    isLoading,
    error,
  } = useChatStore();

  const [hasMore, setHasMore] = useState(false);

  const fetchMessages = useCallback(
    async (conversationId: string) => {
      log("fetchMessages", conversationId);
      setIsLoading(true);
      setError(null);
      try {
        const response = await chatService.getMessages(conversationId);
        log("fetchMessages response", {
          count: response.messages.length,
          hasMore: response.hasMore,
        });
        setMessages(response.messages);
        setHasMore(response.hasMore);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch messages";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [setMessages, setIsLoading, setError]
  );

  const loadMoreMessages = useCallback(async () => {
    if (!currentConversation || messages.length === 0 || !hasMore) return;

    const oldestMessage = messages[0];
    log("loadMoreMessages", { before: oldestMessage.sentAt });

    try {
      const response = await chatService.getMessages(currentConversation._id, {
        before: oldestMessage.sentAt,
      });
      setMessages([...response.messages, ...messages]);
      setHasMore(response.hasMore);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    }
  }, [currentConversation, messages, hasMore, setMessages]);

  const sendMessage = useCallback(
    async (body: string, attachments?: Message["attachments"]) => {
      if (!currentConversation) return null;

      log("sendMessage", { body, attachments: attachments?.length });
      try {
        const message = await chatService.sendMessage({
          conversationId: currentConversation._id,
          messageType: attachments && attachments.length > 0 ? "Attachment" : "Text",
          body,
          attachments,
        });
        addMessage(message);
        return message;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to send message";
        setError(errorMessage);
        throw err;
      }
    },
    [currentConversation, addMessage, setError]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      log("deleteMessage", messageId);
      try {
        await chatService.deleteMessage(messageId);
        removeMessage(messageId);
      } catch (err) {
        console.error("Failed to delete message:", err);
        throw err;
      }
    },
    [removeMessage]
  );

  const selectConversation = useCallback(
    async (conversation: Conversation | null) => {
      log("selectConversation", conversation?._id);
      setCurrentConversation(conversation);
      if (conversation) {
        await fetchMessages(conversation._id);
        // Mark as read
        try {
          await chatService.markConversationAsRead(conversation._id);
        } catch (err) {
          console.error("Failed to mark as read:", err);
        }
      } else {
        setMessages([]);
      }
    },
    [setCurrentConversation, fetchMessages, setMessages]
  );

  return {
    messages,
    currentConversation,
    hasMore,
    isLoading,
    error,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    deleteMessage,
    selectConversation,
    addMessage,
  };
}

/**
 * Hook to manage unread count
 */
export function useUnreadCount() {
  const { unreadCount, setUnreadCount, incrementUnreadCount, decrementUnreadCount } =
    useChatStore();
  const { user } = useAuthStore();

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    log("fetchUnreadCount");
    try {
      const count = await chatService.getUnreadCount();
      log("fetchUnreadCount response", count);
      setUnreadCount(count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [user, setUnreadCount]);

  // Fetch on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  return {
    unreadCount,
    fetchUnreadCount,
    incrementUnreadCount,
    decrementUnreadCount,
  };
}

/**
 * Hook to manage chat box open state
 */
export function useChatBox() {
  const { isOpen, setIsOpen, toggleOpen } = useChatStore();

  const openChat = useCallback(() => setIsOpen(true), [setIsOpen]);
  const closeChat = useCallback(() => setIsOpen(false), [setIsOpen]);

  return {
    isOpen,
    openChat,
    closeChat,
    toggleChat: toggleOpen,
  };
}

/**
 * Hook to manage support tickets
 */
export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    log("fetchTickets");
    setIsLoading(true);
    setError(null);
    try {
      const response = await chatService.getTickets();
      log("fetchTickets response", { count: response.tickets.length });
      setTickets(response.tickets);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch tickets";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createTicket = useCallback(
    async (data: { orderItemId: string; title: string; content: string; type?: "Complaint" | "Dispute" | "General" }) => {
      log("createTicket", data);
      setIsLoading(true);
      try {
        const result = await chatService.createTicket(data);
        setTickets((prev) => [result.ticket, ...prev]);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to create ticket";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    tickets,
    isLoading,
    error,
    fetchTickets,
    createTicket,
  };
}

/**
 * Combined hook for chat functionality
 */
export function useChat() {
  const conversations = useConversations();
  const messages = useMessages();
  const unread = useUnreadCount();
  const chatBox = useChatBox();
  const tickets = useTickets();

  // Initialize on mount
  useEffect(() => {
    const { user } = useAuthStore.getState();
    if (user) {
      log("useChat - initializing for user", user.id);
      conversations.fetchConversations();
      unread.fetchUnreadCount();
    }
  }, []);

  return {
    // Conversations
    conversations: conversations.conversations,
    createConversation: conversations.createConversation,
    fetchConversations: conversations.fetchConversations,

    // Messages
    messages: messages.messages,
    currentConversation: messages.currentConversation,
    sendMessage: messages.sendMessage,
    selectConversation: messages.selectConversation,
    loadMoreMessages: messages.loadMoreMessages,
    hasMoreMessages: messages.hasMore,
    addMessage: messages.addMessage,

    // Unread
    unreadCount: unread.unreadCount,
    fetchUnreadCount: unread.fetchUnreadCount,
    incrementUnreadCount: unread.incrementUnreadCount,

    // Chat box
    isOpen: chatBox.isOpen,
    openChat: chatBox.openChat,
    closeChat: chatBox.closeChat,
    toggleChat: chatBox.toggleChat,

    // Tickets
    tickets: tickets.tickets,
    createTicket: tickets.createTicket,
    fetchTickets: tickets.fetchTickets,

    // Loading states
    isLoading: conversations.isLoading || messages.isLoading,
    error: conversations.error || messages.error,
  };
}

export default useChat;
