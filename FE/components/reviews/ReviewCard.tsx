"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { MoreHorizontal, Pencil, Trash2, Flag, Eye, EyeOff, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { RatingStars } from "./RatingStars";
import type { Review } from "@/lib/services/review.service";

interface ReviewCardProps {
  review: Review;
  currentUserId?: string;
  isModerator?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  onHide?: (reviewId: string) => void;
  onUnhide?: (reviewId: string) => void;
  onReport?: (reviewId: string) => void;
  className?: string;
}

export function ReviewCard({
  review,
  currentUserId,
  isModerator = false,
  onEdit,
  onDelete,
  onHide,
  onUnhide,
  onReport,
  className,
}: ReviewCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Extract user info (handle populated or non-populated)
  const user = typeof review.userId === "object" ? review.userId : null;
  const userName = user?.fullName || "Người dùng";
  const userAvatar = user?.avatarUrl;
  const userInitial = userName.charAt(0).toUpperCase();

  // Check if current user owns this review
  const isOwner =
    currentUserId &&
    (typeof review.userId === "string"
      ? review.userId === currentUserId
      : review.userId._id === currentUserId);

  // Format date
  const formattedDate = formatDistanceToNow(new Date(review.createdAt), {
    addSuffix: true,
    locale: vi,
  });

  const isHidden = review.status === "Hidden";

  return (
    <Card className={cn(isHidden && "opacity-60", className)}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback>{userInitial}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{userName}</span>
                {isHidden && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                    Đã ẩn
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <RatingStars rating={review.rating} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          {(isOwner || isModerator || onReport) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwner && onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(review)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                )}
                {isOwner && onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(review._id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                )}
                {isModerator && !isHidden && onHide && (
                  <DropdownMenuItem onClick={() => onHide(review._id)}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Ẩn đánh giá
                  </DropdownMenuItem>
                )}
                {isModerator && isHidden && onUnhide && (
                  <DropdownMenuItem onClick={() => onUnhide(review._id)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Hiện đánh giá
                  </DropdownMenuItem>
                )}
                {!isOwner && onReport && (
                  <DropdownMenuItem onClick={() => onReport(review._id)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Báo cáo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Comment */}
        <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
          {review.comment}
        </p>

        {/* Images */}
        {review.images && review.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {review.images.map((image, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <button
                    className="w-16 h-16 rounded-lg overflow-hidden border border-border hover:opacity-80 transition-opacity"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image}
                      alt={`Review image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl p-0 overflow-hidden">
                  <img
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-full h-auto max-h-[80vh] object-contain"
                  />
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {/* Seller Reply */}
        {review.sellerReply && (
          <div className="mt-4 ml-4 p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Phản hồi của shop</span>
              {review.sellerReplyAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.sellerReplyAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </span>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap">{review.sellerReply}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
