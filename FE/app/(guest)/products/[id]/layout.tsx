import type { Metadata } from "next";
import { getServerProductById } from "@/lib/server-api";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getServerProductById(id);

  if (!product) {
    return {
      title: "Sản phẩm không tồn tại",
      description: "Sản phẩm này không tồn tại hoặc đã bị xóa.",
    };
  }

  const title = product.title;
  const description =
    product.description?.slice(0, 160) ||
    `Mua ${product.title} với giá ${product.price.toLocaleString("vi-VN")}đ. Giao hàng tức thì, bảo hành ${product.durationDays} ngày.`;

  return {
    title,
    description,
    keywords: [
      product.title,
      product.planType,
      "license key",
      "subscription",
      "sản phẩm số",
    ],
    openGraph: {
      title: `${title} - Digital Marketplace`,
      description,
      type: "website",
      images: product.thumbnailUrl
        ? [
            {
              url: product.thumbnailUrl,
              width: 800,
              height: 600,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.thumbnailUrl ? [product.thumbnailUrl] : undefined,
    },
  };
}

export default function ProductDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
