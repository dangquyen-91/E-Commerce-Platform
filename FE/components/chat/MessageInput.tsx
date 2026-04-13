"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Send, Paperclip, X, Image as ImageIcon, FileText } from "lucide-react";
import { useSocket } from "@/lib/hooks/useSocket";
import { useAuthStore } from "@/lib/auth";
import { Message } from "@/lib/services/chat.service";
import { cn } from "@/lib/utils";

// Debug logger
const DEBUG = process.env.NODE_ENV === "development";
const log = (action: string, data?: unknown) => {
  if (DEBUG) {
    console.log(`[MessageInput] ${action}`, data ?? "");
  }
};

interface MessageInputProps {
  conversationId: string;
  onSend: (body: string, attachments?: Message["attachments"]) => Promise<void>;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const { user } = useAuthStore();
  const { sendTypingStart, sendTypingStop } = useSocket();

  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!user?.id) return;

    // Send typing start if not already typing
    if (!isTyping) {
      log("typing start");
      setIsTyping(true);
      sendTypingStart(conversationId, user.id, user.name || "User");
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      log("typing stop (timeout)");
      setIsTyping(false);
      sendTypingStop(conversationId, user.id);
    }, 2000);
  }, [conversationId, user, isTyping, sendTypingStart, sendTypingStop]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && user?.id) {
        sendTypingStop(conversationId, user.id);
      }
    };
  }, [conversationId, user?.id, isTyping, sendTypingStop]);

  // Handle message change
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    handleTyping();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    log("files selected", files.map((f) => f.name));

    // Limit to 5 files
    const newAttachments = [...attachments, ...files].slice(0, 5);
    setAttachments(newAttachments);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Remove attachment
  const handleRemoveAttachment = (index: number) => {
    log("remove attachment", index);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle send
  const handleSend = async () => {
    if (isSending || disabled) return;
    if (!message.trim() && attachments.length === 0) return;

    log("sending", { message: message.trim(), attachments: attachments.length });
    setIsSending(true);

    try {
      // Stop typing indicator
      if (isTyping && user?.id) {
        sendTypingStop(conversationId, user.id);
        setIsTyping(false);
      }

      // TODO: Upload attachments to get URLs
      // For now, just send text
      const messageAttachments: Message["attachments"] = attachments.length > 0
        ? attachments.map((file) => ({
            url: URL.createObjectURL(file), // Placeholder - should upload to server
            type: file.type,
            fileName: file.name,
          }))
        : undefined;

      await onSend(message.trim(), messageAttachments);

      // Clear inputs
      setMessage("");
      setAttachments([]);
      inputRef.current?.focus();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((file, index) => (
            <AttachmentChip
              key={index}
              file={file}
              onRemove={() => handleRemoveAttachment(index)}
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= 5}
          className={cn(
            "p-2 rounded-full transition-colors",
            "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
            "dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700",
            (disabled || attachments.length >= 5) && "opacity-50 cursor-not-allowed"
          )}
        >
          <Paperclip className="w-5 h-5" />
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            disabled={disabled || isSending}
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border border-gray-200 dark:border-gray-600",
              "px-4 py-2 pr-10 text-sm",
              "bg-gray-50 dark:bg-gray-700",
              "text-gray-900 dark:text-gray-100",
              "placeholder:text-gray-500 dark:placeholder:text-gray-400",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "max-h-[120px]"
            )}
          />
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || isSending || (!message.trim() && attachments.length === 0)}
          className={cn(
            "p-2 rounded-full transition-colors",
            "bg-blue-500 text-white",
            "hover:bg-blue-600",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isSending && "animate-pulse"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

interface AttachmentChipProps {
  file: File;
  onRemove: () => void;
}

function AttachmentChip({ file, onRemove }: AttachmentChipProps) {
  const isImage = file.type.startsWith("image/");
  const preview = isImage ? URL.createObjectURL(file) : null;

  return (
    <div className="relative group">
      {isImage ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
          <img
            src={preview!}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
            {file.name}
          </span>
        </div>
      )}

      {/* Remove button */}
      <button
        type="button"
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

export default MessageInput;
