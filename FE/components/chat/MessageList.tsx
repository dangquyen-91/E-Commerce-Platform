"use client";

import { useEffect, useRef } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { vi } from "date-fns/locale";
import { FileText, Check, CheckCheck } from "lucide-react";
import { Message } from "@/lib/services/chat.service";
import { cn } from "@/lib/utils";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[MessageList] ${action}`, data ?? "");
  }
};

interface MessageListProps {
  messages: Message[];
  currentUserId?: string;
  typingUser?: string | null;
}

const getSenderId = (message: Message): string | undefined => {
  const s: any = (message as any).senderUserId;
  if (!s) return undefined;
  return typeof s === "string" ? s : s?._id?.toString();
};

export function MessageList({
  messages = [],
  currentUserId,
  typingUser,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  log("render", { count: messages?.length ?? 0, typingUser });

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length, typingUser]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
        <p className="text-sm">Chưa có tin nhắn nào</p>
        <p className="text-xs mt-1">Hãy bắt đầu cuộc trò chuyện!</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div ref={scrollRef} className="overflow-y-auto h-full p-4 space-y-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full px-3 py-1">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {date}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-2">
            {dateMessages.map((message, index) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={!!currentUserId && getSenderId(message) === currentUserId}
                showAvatar={shouldShowAvatar(dateMessages, index, currentUserId)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {typingUser && (
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
          </div>
          <span className="text-xs">{typingUser} đang nhập...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

function MessageBubble({ message, isOwn, showAvatar }: MessageBubbleProps) {
  const isSystem = message.messageType === "System";
  const isInternal = message.isInternal;
  const time = format(new Date(message.sentAt), "HH:mm", { locale: vi });
  const isRead = message.readAt || (message.readBy && message.readBy.length > 0);

  // System message
  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5 max-w-[80%]">
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            {message.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
        !showAvatar && !isOwn && "pl-10"
      )}
    >
      {/* Avatar placeholder */}
      {showAvatar && !isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex-shrink-0" />
      )}

      {/* Message content */}
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn
            ? "bg-blue-500 text-white rounded-br-sm"
            : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm",
          isInternal && "border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
        )}
      >
        {/* Internal badge */}
        {isInternal && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium block mb-1">
            Ghi chú nội bộ
          </span>
        )}

        {/* Text body */}
        {message.body && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.body}</p>
        )}

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, idx) => (
              <AttachmentPreview key={idx} attachment={attachment} isOwn={isOwn} />
            ))}
          </div>
        )}

        {/* Time and read status */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              isOwn ? "text-white/70" : "text-gray-500 dark:text-gray-400"
            )}
          >
            {time}
          </span>
          {isOwn && (isRead ? <CheckCheck className="w-3 h-3 text-white/70" /> : <Check className="w-3 h-3 text-white/70" />)}
        </div>
      </div>
    </div>
  );
}

interface AttachmentPreviewProps {
  attachment: NonNullable<Message["attachments"]>[0];
  isOwn: boolean;
}

function AttachmentPreview({ attachment, isOwn }: AttachmentPreviewProps) {
  const isImage = attachment.type?.startsWith("image/");

  if (isImage) {
    return (
      <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.url}
          alt={attachment.fileName || "Image"}
          className="max-w-full rounded-lg max-h-48 object-cover"
        />
      </a>
    );
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg",
        isOwn
          ? "bg-white/20 hover:bg-white/30"
          : "bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500"
      )}
    >
      <FileText className="w-5 h-5" />
      <span className="text-sm truncate">{attachment.fileName || "File"}</span>
    </a>
  );
}

// Helper: Group messages by date
function groupMessagesByDate(messages: Message[]): Record<string, Message[]> {
  const groups: Record<string, Message[]> = {};

  messages.forEach((message) => {
    const date = new Date(message.sentAt);
    let dateKey: string;

    if (isToday(date)) {
      dateKey = "Hôm nay";
    } else if (isYesterday(date)) {
      dateKey = "Hôm qua";
    } else {
      dateKey = format(date, "dd/MM/yyyy", { locale: vi });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
  });

  return groups;
}

// Helper: Check if avatar should be shown (first message of a sequence from same sender)
function shouldShowAvatar(messages: Message[], index: number, currentUserId?: string): boolean {
  if (index === 0) return true;
  const currSender = getSenderId(messages[index]);
  const prevSender = getSenderId(messages[index - 1]);

  // Don't show avatar for your own messages
  if (currentUserId && currSender === currentUserId) return false;

  return currSender !== prevSender;
}

export default MessageList;
