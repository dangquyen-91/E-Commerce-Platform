"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/auth";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[Socket] ${action}`, data ?? "");
  }
};

// Socket event types - Reviews
export interface SocketReviewPayload {
  reviewId: string;
  productId: string;
  shopId: string;
  userId?: string;
  rating?: number;
  comment?: string;
  images?: string[];
  productRatingAvg?: number;
  productReviewCount?: number;
  shopRatingAvg?: number;
}

type ReviewEventType = "review:created" | "review:updated" | "review:deleted";
type ReviewEventHandler = (payload: SocketReviewPayload) => void;

// Socket event types - Chat
export interface SocketMessagePayload {
  messageId: string;
  conversationId: string;
  senderUserId: string;
  senderName?: string;
  messageType: "Text" | "System" | "Attachment";
  body?: string;
  attachments?: Array<{
    url: string;
    type: string;
    fileName?: string;
  }>;
  isInternal?: boolean;
  sentAt: Date | string;
}

export interface SocketConversationPayload {
  conversationId: string;
  status?: string;
  lastMessagePreview?: string;
  lastMessageAt?: Date | string;
  unreadCount?: Record<string, number>;
}

export interface SocketTicketPayload {
  ticketId: string;
  ticketCode: string;
  status?: string;
  priority?: string;
  assignedToUserId?: string;
  customerUserId?: string;
}

export interface TypingPayload {
  conversationId: string;
  userId: string;
  userName?: string;
}

type ChatEventType = "message:new" | "message:read" | "message:deleted";
type ConversationEventType = "conversation:updated" | "conversation:closed";
type TicketEventType = "ticket:created" | "ticket:updated" | "ticket:assigned" | "ticket:escalated" | "ticket:resolved";
type TypingEventType = "typing:start" | "typing:stop";

type ChatEventHandler = (payload: SocketMessagePayload) => void;
type ConversationEventHandler = (payload: SocketConversationPayload) => void;
type TicketEventHandler = (payload: SocketTicketPayload) => void;
type TypingEventHandler = (payload: TypingPayload) => void;

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:3001";

/**
 * Hook to manage WebSocket connection for real-time review updates
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
      withCredentials: true,
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected:", socketRef.current?.id);
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Join a product room to receive product-specific events
  const joinProductRoom = useCallback((productId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join:product", productId);
    }
  }, []);

  // Leave a product room
  const leaveProductRoom = useCallback((productId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave:product", productId);
    }
  }, []);

  // Join a shop room to receive shop-wide events
  const joinShopRoom = useCallback((shopId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("join:shop", shopId);
    }
  }, []);

  // Leave a shop room
  const leaveShopRoom = useCallback((shopId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("leave:shop", shopId);
    }
  }, []);

  // Subscribe to review events
  const onReviewEvent = useCallback(
    (eventType: ReviewEventType, handler: ReviewEventHandler) => {
      if (socketRef.current) {
        socketRef.current.on(eventType, handler);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventType, handler);
        }
      };
    },
    []
  );

  // Subscribe to all review events with a single handler
  const onAnyReviewEvent = useCallback((handler: (eventType: ReviewEventType, payload: SocketReviewPayload) => void) => {
    const events: ReviewEventType[] = ["review:created", "review:updated", "review:deleted"];

    events.forEach((eventType) => {
      socketRef.current?.on(eventType, (payload: SocketReviewPayload) => {
        handler(eventType, payload);
      });
    });

    return () => {
      events.forEach((eventType) => {
        socketRef.current?.off(eventType);
      });
    };
  }, []);

  // ===== Chat Socket Methods =====

  // Join conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      log("joinConversation", conversationId);
      socketRef.current.emit("join:conversation", conversationId);
    }
  }, []);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      log("leaveConversation", conversationId);
      socketRef.current.emit("leave:conversation", conversationId);
    }
  }, []);

  // Join user room for personal notifications - AUTOMATICALLY use authenticated userId
  const joinUserRoom = useCallback(() => {
    if (socketRef.current?.connected) {
      log("joinUserRoom");
      socketRef.current.emit("join:user");
    }
  }, []);

  // Leave user room
  const leaveUserRoom = useCallback(() => {
    if (socketRef.current?.connected) {
      log("leaveUserRoom");
      socketRef.current.emit("leave:user");
    }
  }, []);

  // Join staff tickets room
  const joinStaffTickets = useCallback(() => {
    if (socketRef.current?.connected) {
      log("joinStaffTickets");
      socketRef.current.emit("join:staff:tickets");
    }
  }, []);

  // Leave staff tickets room
  const leaveStaffTickets = useCallback(() => {
    if (socketRef.current?.connected) {
      log("leaveStaffTickets");
      socketRef.current.emit("leave:staff:tickets");
    }
  }, []);

  // Send typing indicator
  const sendTypingStart = useCallback((conversationId: string, userId: string, userName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing:start", { conversationId, userId, userName });
    }
  }, []);

  const sendTypingStop = useCallback((conversationId: string, userId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing:stop", { conversationId, userId });
    }
  }, []);

  // Subscribe to chat events
  const onChatEvent = useCallback(
    (eventType: ChatEventType, handler: ChatEventHandler) => {
      if (socketRef.current) {
        log("subscribing to", eventType);
        socketRef.current.on(eventType, handler);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventType, handler);
        }
      };
    },
    []
  );

  // Subscribe to conversation events
  const onConversationEvent = useCallback(
    (eventType: ConversationEventType, handler: ConversationEventHandler) => {
      if (socketRef.current) {
        log("subscribing to", eventType);
        socketRef.current.on(eventType, handler);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventType, handler);
        }
      };
    },
    []
  );

  // Subscribe to ticket events
  const onTicketEvent = useCallback(
    (eventType: TicketEventType, handler: TicketEventHandler) => {
      if (socketRef.current) {
        log("subscribing to", eventType);
        socketRef.current.on(eventType, handler);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventType, handler);
        }
      };
    },
    []
  );

  // Subscribe to typing events
  const onTypingEvent = useCallback(
    (eventType: TypingEventType, handler: TypingEventHandler) => {
      if (socketRef.current) {
        socketRef.current.on(eventType, handler);
      }
      return () => {
        if (socketRef.current) {
          socketRef.current.off(eventType, handler);
        }
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected,
    // Review methods
    joinProductRoom,
    leaveProductRoom,
    joinShopRoom,
    leaveShopRoom,
    onReviewEvent,
    onAnyReviewEvent,
    // Chat methods
    joinConversation,
    leaveConversation,
    joinUserRoom,
    leaveUserRoom,
    joinStaffTickets,
    leaveStaffTickets,
    sendTypingStart,
    sendTypingStop,
    onChatEvent,
    onConversationEvent,
    onTicketEvent,
    onTypingEvent,
  };
}

/**
 * Hook to subscribe to real-time review updates for a specific product
 */
export function useProductReviews(
  productId: string | null,
  onReviewCreated?: ReviewEventHandler,
  onReviewUpdated?: ReviewEventHandler,
  onReviewDeleted?: ReviewEventHandler
) {
  const {
    isConnected,
    joinProductRoom,
    leaveProductRoom,
    onReviewEvent,
  } = useSocket();

  useEffect(() => {
    if (!productId || !isConnected) return;

    // Join the product room
    joinProductRoom(productId);

    // Subscribe to events
    const unsubCreated = onReviewCreated
      ? onReviewEvent("review:created", onReviewCreated)
      : () => {};
    const unsubUpdated = onReviewUpdated
      ? onReviewEvent("review:updated", onReviewUpdated)
      : () => {};
    const unsubDeleted = onReviewDeleted
      ? onReviewEvent("review:deleted", onReviewDeleted)
      : () => {};

    return () => {
      leaveProductRoom(productId);
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [
    productId,
    isConnected,
    joinProductRoom,
    leaveProductRoom,
    onReviewEvent,
    onReviewCreated,
    onReviewUpdated,
    onReviewDeleted,
  ]);

  return { isConnected };
}

/**
 * Hook to subscribe to real-time review updates for a specific shop
 */
export function useShopReviews(
  shopId: string | null,
  onReviewCreated?: ReviewEventHandler,
  onReviewUpdated?: ReviewEventHandler,
  onReviewDeleted?: ReviewEventHandler
) {
  const {
    isConnected,
    joinShopRoom,
    leaveShopRoom,
    onReviewEvent,
  } = useSocket();

  useEffect(() => {
    if (!shopId || !isConnected) return;

    // Join the shop room
    joinShopRoom(shopId);

    // Subscribe to events
    const unsubCreated = onReviewCreated
      ? onReviewEvent("review:created", onReviewCreated)
      : () => {};
    const unsubUpdated = onReviewUpdated
      ? onReviewEvent("review:updated", onReviewUpdated)
      : () => {};
    const unsubDeleted = onReviewDeleted
      ? onReviewEvent("review:deleted", onReviewDeleted)
      : () => {};

    return () => {
      leaveShopRoom(shopId);
      unsubCreated();
      unsubUpdated();
      unsubDeleted();
    };
  }, [
    shopId,
    isConnected,
    joinShopRoom,
    leaveShopRoom,
    onReviewEvent,
    onReviewCreated,
    onReviewUpdated,
    onReviewDeleted,
  ]);

  return { isConnected };
}

/**
 * Hook to subscribe to real-time chat messages for a specific conversation
 */
export function useChatMessages(
  conversationId: string | null,
  onMessageNew?: ChatEventHandler,
  onMessageDeleted?: ChatEventHandler,
  onTypingStart?: TypingEventHandler,
  onTypingStop?: TypingEventHandler
) {
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    onChatEvent,
    onTypingEvent,
  } = useSocket();

  useEffect(() => {
    if (!conversationId || !isConnected) return;

    log("useChatMessages - joining conversation", conversationId);
    joinConversation(conversationId);

    const unsubNew = onMessageNew
      ? onChatEvent("message:new", onMessageNew)
      : () => {};
    const unsubDeleted = onMessageDeleted
      ? onChatEvent("message:deleted", onMessageDeleted)
      : () => {};
    const unsubTypingStart = onTypingStart
      ? onTypingEvent("typing:start", onTypingStart)
      : () => {};
    const unsubTypingStop = onTypingStop
      ? onTypingEvent("typing:stop", onTypingStop)
      : () => {};

    return () => {
      log("useChatMessages - leaving conversation", conversationId);
      leaveConversation(conversationId);
      unsubNew();
      unsubDeleted();
      unsubTypingStart();
      unsubTypingStop();
    };
  }, [
    conversationId,
    isConnected,
    joinConversation,
    leaveConversation,
    onChatEvent,
    onTypingEvent,
    onMessageNew,
    onMessageDeleted,
    onTypingStart,
    onTypingStop,
  ]);

  return { isConnected };
}

/**
 * Hook to subscribe to user notifications (new messages, ticket updates)
 */
export function useUserNotifications(
  onNewMessage?: ChatEventHandler,
  onConversationUpdate?: ConversationEventHandler,
  onTicketUpdate?: TicketEventHandler
) {
  const { user, isAuthenticated } = useAuthStore();
  const userId = user?.id ?? null;

  const {
    isConnected,
    joinUserRoom,
    leaveUserRoom,
    onChatEvent,
    onConversationEvent,
    onTicketEvent,
  } = useSocket();

  useEffect(() => {
    if (!isAuthenticated || !userId || !isConnected) return;

    log("useUserNotifications - joining user room", userId);
    joinUserRoom();

    const unsubNewMessage = onNewMessage
      ? onChatEvent("message:new", onNewMessage)
      : () => {};
    const unsubConvUpdate = onConversationUpdate
      ? onConversationEvent("conversation:updated", onConversationUpdate)
      : () => {};
    const unsubTicketCreated = onTicketUpdate
      ? onTicketEvent("ticket:created", onTicketUpdate)
      : () => {};
    const unsubTicketUpdated = onTicketUpdate
      ? onTicketEvent("ticket:updated", onTicketUpdate)
      : () => {};

    return () => {
      log("useUserNotifications - leaving user room", userId);
      leaveUserRoom();
      unsubNewMessage();
      unsubConvUpdate();
      unsubTicketCreated();
      unsubTicketUpdated();
    };
  }, [
    userId,
    isAuthenticated,
    isConnected,
    joinUserRoom,
    leaveUserRoom,
    onChatEvent,
    onConversationEvent,
    onTicketEvent,
    onNewMessage,
    onConversationUpdate,
    onTicketUpdate,
  ]);

  return { isConnected };
}
