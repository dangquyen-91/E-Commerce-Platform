import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cửa hàng",
  description:
    "Xem thông tin chi tiết cửa hàng, sản phẩm đang bán và đánh giá từ người mua. Mua sắm an toàn với hệ thống escrow.",
  openGraph: {
    title: "Cửa hàng - Digital Marketplace",
    description:
      "Xem thông tin chi tiết cửa hàng và sản phẩm đang bán. Mua sắm an toàn với hệ thống escrow.",
    type: "website",
  },
};

export default function ShopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
