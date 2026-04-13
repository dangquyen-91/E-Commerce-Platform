"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ReviewForm } from "./ReviewForm";
import { reviewService } from "@/lib/services/review.service";
import type { CreateReviewRequest, UpdateReviewRequest } from "@/lib/services/review.service";

interface WriteReviewButtonProps {
  orderItemId: string;
  productId: string;
  shopId: string;
  productTitle?: string;
  onReviewSubmitted?: () => void;
  disabled?: boolean;
  className?: string;
}

export function WriteReviewButton({
  orderItemId,
  productId,
  shopId,
  productTitle,
  onReviewSubmitted,
  disabled = false,
  className,
}: WriteReviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const handleSubmit = async (data: CreateReviewRequest | UpdateReviewRequest) => {
    try {
      await reviewService.createReview(data as CreateReviewRequest);
      toast.success("Đã gửi đánh giá thành công!");
      setHasReviewed(true);
      setIsOpen(false);
      onReviewSubmitted?.();
    } catch (error: any) {
      // Check if error is "already reviewed"
      if (error?.message?.includes("already") || error?.message?.includes("đã đánh giá")) {
        toast.error("Bạn đã đánh giá sản phẩm này rồi");
        setHasReviewed(true);
      } else {
        toast.error(error?.message || "Không thể gửi đánh giá");
      }
      throw error;
    }
  };

  if (hasReviewed) {
    return (
      <Button variant="outline" disabled className={className}>
        <Star className="mr-2 h-4 w-4 fill-yellow-400 text-yellow-400" />
        Đã đánh giá
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} className={className}>
          <Star className="mr-2 h-4 w-4" />
          Viết đánh giá
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Đánh giá sản phẩm
            {productTitle && (
              <span className="block text-sm font-normal text-muted-foreground mt-1">
                {productTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <ReviewForm
          orderItemId={orderItemId}
          productId={productId}
          shopId={shopId}
          onSubmit={handleSubmit}
          onCancel={() => setIsOpen(false)}
          className="border-0 shadow-none p-0"
        />
      </DialogContent>
    </Dialog>
  );
}
