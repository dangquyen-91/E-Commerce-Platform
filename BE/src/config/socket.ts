import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { env } from "./env";
import { User, Conversation } from "@/models";
import { USER_STATUS } from "@/constants/roles";
import {
  SocketReviewPayload,
  SocketReviewEventType,
  SocketChatEventType,
  SocketTicketEventType,
  SocketMessagePayload,
  SocketConversationPayload,
  SocketTicketPayload,
} from "@/types";

let io: Server | null = null;

type SocketAuthData = {
  userId: string;
  email: string;
  roleKey: string;
};

export const initializeSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Socket authentication middleware (cookie-based)
  io.use(async (socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) {
        return next(new Error("Authentication error: missing cookie"));
      }

      const parsed = cookie.parse(rawCookie);
      const token = parsed.accessToken;
      if (!token) {
        return next(new Error("Authentication error: missing accessToken"));
      }

      const decoded = jwt.verify(token, env.jwtSecret) as { userId: string; email: string };

      const user = await User.findById(decoded.userId).populate("roleId");
      if (!user || user.isDeleted || user.status !== USER_STATUS.ACTIVE) {
        return next(new Error("Authentication error: user not found/inactive"));
      }

      const populatedRole = user.roleId as any;
      (socket.data as any).auth = {
        userId: user._id.toString(),
        email: user.email,
        roleKey: populatedRole?.roleKey,
      } satisfies SocketAuthData;

      next();
    } catch {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const auth = (socket.data as any).auth as SocketAuthData | undefined;

    // Join product room to receive product-specific review events
    socket.on("join:product", (productId: string) => {
      socket.join(`product:${productId}`);
    });

    // Leave product room
    socket.on("leave:product", (productId: string) => {
      socket.leave(`product:${productId}`);
    });

    // Join shop room to receive shop-wide review events
    socket.on("join:shop", (shopId: string) => {
      socket.join(`shop:${shopId}`);
    });

    // Leave shop room
    socket.on("leave:shop", (shopId: string) => {
      socket.leave(`shop:${shopId}`);
    });

    // ===== Chat Socket Events =====

    // Join conversation room to receive real-time messages
    socket.on("join:conversation", async (conversationId: string) => {
      if (!auth?.userId) return;

      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        // Check if user is a participant
        const isParticipant =
          conversation.customerUserId.toString() === auth.userId ||
          conversation.sellerUserId?.toString() === auth.userId ||
          conversation.staffUserId?.toString() === auth.userId;

        // Staff can join any support conversation
        const isStaff = ["MODERATOR", "SENIOR_MOD", "ADMIN"].includes(auth.roleKey);
        const canJoin = isParticipant || (isStaff && conversation.type === "Support");

        if (canJoin) {
      socket.join(`conversation:${conversationId}`);
        }
      } catch (err) {
        // Silently ignore or log error
      }
    });

    // Leave conversation room
    socket.on("leave:conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Join user room for personal notifications (use authenticated userId)
    socket.on("join:user", () => {
      if (!auth?.userId) return;
      socket.join(`user:${auth.userId}`);
    });

    // Leave user room
    socket.on("leave:user", () => {
      if (!auth?.userId) return;
      socket.leave(`user:${auth.userId}`);
    });

    // Join staff tickets room for ticket notifications (restricted)
    socket.on("join:staff:tickets", () => {
      if (!auth?.roleKey) return;
      if (["MODERATOR", "SENIOR_MOD", "ADMIN"].includes(auth.roleKey)) {
      socket.join("staff:tickets");
      }
    });

    // Leave staff tickets room
    socket.on("leave:staff:tickets", () => {
      socket.leave("staff:tickets");
    });

    // Typing indicator events
    socket.on("typing:start", (data: { conversationId: string; userName: string }) => {
      if (!auth?.userId) return;
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId: auth.userId,
        userName: data.userName,
      });
    });

    socket.on("typing:stop", (data: { conversationId: string }) => {
      if (!auth?.userId) return;
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId: auth.userId,
      });
    });

    socket.on("disconnect", () => {
      // Socket disconnected
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

// Emit review events to specific rooms
export const emitReviewEvent = (
  eventType: SocketReviewEventType,
  payload: SocketReviewPayload
): void => {
  if (!io) {
    return;
  }

  // Emit to product room
  io.to(`product:${payload.productId}`).emit(eventType, payload);

  // Emit to shop room
  io.to(`shop:${payload.shopId}`).emit(eventType, payload);
};

// ===== Chat Event Emitters =====

/**
 * Emit chat events to conversation room and participants
 */
export const emitChatEvent = (
  eventType: SocketChatEventType,
  payload: SocketMessagePayload
): void => {
  if (!io) {
    return;
  }

  // Emit to conversation room
  io.to(`conversation:${payload.conversationId}`).emit(eventType, payload);

  // Also emit to sender's user room for multi-device sync
  io.to(`user:${payload.senderUserId}`).emit(eventType, payload);
};

/**
 * Emit conversation update events
 */
export const emitConversationEvent = (
  eventType: "conversation:updated" | "conversation:closed",
  payload: SocketConversationPayload,
  participantUserIds: string[]
): void => {
  if (!io) {
    return;
  }

  // Emit to conversation room
  io.to(`conversation:${payload.conversationId}`).emit(eventType, payload);

  // Also emit to all participants' user rooms
  for (const userId of participantUserIds) {
    io.to(`user:${userId}`).emit(eventType, payload);
  }
};

/**
 * Emit ticket events to customer and staff
 */
export const emitTicketEvent = (
  eventType: SocketTicketEventType,
  payload: SocketTicketPayload
): void => {
  if (!io) {
    return;
  }

  // Emit to customer's user room
  if (payload.customerUserId) {
    io.to(`user:${payload.customerUserId}`).emit(eventType, payload);
  }

  // Emit to assigned staff's user room
  if (payload.assignedToUserId) {
    io.to(`user:${payload.assignedToUserId}`).emit(eventType, payload);
  }

  // Emit to staff tickets room for new/escalated tickets
  if (eventType === "ticket:created" || eventType === "ticket:escalated") {
    io.to("staff:tickets").emit(eventType, payload);
  }
};

/**
 * Emit notification to specific user
 */
export const emitUserNotification = (
  userId: string,
  eventType: string,
  payload: Record<string, unknown>
): void => {
  if (!io) {
    return;
  }

  io.to(`user:${userId}`).emit(eventType, payload);
};
