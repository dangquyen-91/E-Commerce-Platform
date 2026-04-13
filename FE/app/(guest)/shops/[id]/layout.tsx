import type { Metadata } from "next";
import { getServerShopById, getServerShopRatingStats } from "@/lib/server-api";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const [shop, ratingStats] = await Promise.all([
    getServerShopById(id),
    getServerShopRatingStats(id),
  ]);

  if (!shop) {
    return {
      title: "Cửa hàng không tồn tại",
      description: "Cửa hàng này không tồn tại hoặc đã ngừng hoạt động.",
    };
  }

  const rating = ratingStats?.averageRating || shop.ratingAvg || 0;
  const reviewCount = ratingStats?.totalReviews || shop.reviewCount || 0;

  const title = shop.shopName;
  const description =
    shop.description?.slice(0, 160) ||
    `${shop.shopName} - Đánh giá ${rating.toFixed(1)}/5 (${reviewCount} đánh giá). Đã bán ${shop.totalSales} sản phẩm.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} - Digital Marketplace`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function ShopDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
