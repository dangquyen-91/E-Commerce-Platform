"use client";

import { useState, useEffect } from "react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { reviewService, Review } from "@/lib/services/review.service";
import { shopService } from "@/lib/services/shop.service";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function SellerReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reply dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchShop() {
      const shop = await shopService.getMyShop();
      if (shop) {
        setShopId(shop._id);
      }
    }
    fetchShop();
  }, []);

  useEffect(() => {
    if (!shopId) return;

    async function fetchReviews() {
      setLoading(true);
      try {
        const res = await reviewService.getReviewsByShop(shopId!, page, 10);
        setReviews(res.reviews);
        setTotalPages(res.totalPages);
      } catch (err) {
        toast.error("Không thể tải đánh giá");
      } finally {
        setLoading(false);
      }
    }
    fetchReviews();
  }, [shopId, page]);

  const handleOpenReply = (review: Review) => {
    setSelectedReview(review);
    setReplyText("");
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!selectedReview || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const updated = await reviewService.replyToReview(
        selectedReview._id,
        replyText.trim()
      );
      setReviews((prev) =>
        prev.map((r) => (r._id === updated._id ? updated : r))
      );
      toast.success("Đã gửi phản hồi");
      setReplyDialogOpen(false);
    } catch (err) {
      toast.error("Không thể gửi phản hồi");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const getUserName = (review: Review) => {
    if (typeof review.userId === "object" && review.userId?.fullName) {
      return review.userId.fullName;
    }
    return "Khách hàng";
  };

  const getProductName = (review: Review) => {
    if (typeof review.productId === "object" && review.productId?.title) {
      return review.productId.title;
    }
    return "Sản phẩm";
  };

  return (
    <RequireAuth requiredRole="seller">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Đánh giá từ khách hàng</h1>
          <p className="text-sm text-muted-foreground">
            Xem và phản hồi đánh giá từ khách hàng
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Danh sách đánh giá</CardTitle>
            <CardDescription>
              Phản hồi đánh giá để tăng uy tín shop
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Chưa có đánh giá nào
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{getUserName(review)}</p>
                        <p className="text-xs text-muted-foreground">
                          {getProductName(review)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {!review.sellerReply && (
                          <Badge variant="secondary" className="text-xs">
                            Chưa phản hồi
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <p className="text-sm">{review.comment}</p>

                    {/* Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {review.images.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Review ${idx + 1}`}
                            className="h-16 w-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}

                    {/* Seller Reply */}
                    {review.sellerReply ? (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-blue-600 mb-1">
                          Phản hồi của Shop
                        </p>
                        <p className="text-sm">{review.sellerReply}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {review.sellerReplyAt &&
                            new Date(review.sellerReplyAt).toLocaleDateString(
                              "vi-VN"
                            )}
                        </p>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReply(review)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Phản hồi
                      </Button>
                    )}

                    {/* Date */}
                    <p className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Trước
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Trang {page} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Phản hồi đánh giá</DialogTitle>
              <DialogDescription>
                Phản hồi lịch sự sẽ giúp tăng uy tín shop
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedReview && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(selectedReview.rating)}
                    <span className="text-sm font-medium">
                      {getUserName(selectedReview)}
                    </span>
                  </div>
                  <p className="text-sm">{selectedReview.comment}</p>
                </div>
              )}
              <Textarea
                placeholder="Nhập phản hồi của bạn..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReplyDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? "Đang gửi..." : "Gửi phản hồi"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RequireAuth>
  );
}
