"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { RatingStars } from "./RatingStars";
import { ImageUpload } from "./ImageUpload";
import type { Review, CreateReviewRequest, UpdateReviewRequest } from "@/lib/services/review.service";

const reviewSchema = z.object({
  rating: z.number().min(1, "Vui lòng chọn số sao").max(5),
  comment: z
    .string()
    .min(10, "Đánh giá phải có ít nhất 10 ký tự")
    .max(1000, "Đánh giá không được quá 1000 ký tự"),
  images: z.array(z.string()).max(5, "Tối đa 5 ảnh").optional(),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  // For creating new review
  orderItemId?: string;
  productId?: string;
  shopId?: string;
  // For editing existing review
  review?: Review;
  // Callbacks
  onSubmit: (data: CreateReviewRequest | UpdateReviewRequest) => Promise<void>;
  onCancel?: () => void;
  onImageUpload?: (file: File) => Promise<string>;
  // UI
  className?: string;
}

export function ReviewForm({
  orderItemId,
  productId,
  shopId,
  review,
  onSubmit,
  onCancel,
  onImageUpload,
  className,
}: ReviewFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!review;

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: review?.rating || 0,
      comment: review?.comment || "",
      images: review?.images || [],
    },
  });

  const handleSubmit = async (values: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing) {
        // Update existing review
        const updateData: UpdateReviewRequest = {
          rating: values.rating,
          comment: values.comment,
          images: values.images,
        };
        await onSubmit(updateData);
      } else {
        // Create new review
        if (!orderItemId || !productId || !shopId) {
          throw new Error("Missing required fields for creating review");
        }
        const createData: CreateReviewRequest = {
          orderItemId,
          productId,
          shopId,
          rating: values.rating,
          comment: values.comment,
          images: values.images,
        };
        await onSubmit(createData);
      }

      if (!isEditing) {
        form.reset();
      }
    } catch {
      // Error handled by onError callback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">
          {isEditing ? "Chỉnh sửa đánh giá" : "Viết đánh giá"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Rating */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Đánh giá của bạn</FormLabel>
                  <FormControl>
                    <div className="pt-1">
                      <RatingStars
                        rating={field.value}
                        size="lg"
                        interactive
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhận xét</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between">
                    <FormMessage />
                    <span className="text-xs text-muted-foreground">
                      {field.value.length}/1000
                    </span>
                  </div>
                </FormItem>
              )}
            />

            {/* Images */}
            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hình ảnh (tùy chọn)</FormLabel>
                  <FormControl>
                    <ImageUpload
                      images={field.value || []}
                      onChange={field.onChange}
                      onUpload={onImageUpload}
                      maxImages={5}
                      maxSizeMB={5}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang gửi...
                  </>
                ) : isEditing ? (
                  "Cập nhật"
                ) : (
                  "Gửi đánh giá"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
