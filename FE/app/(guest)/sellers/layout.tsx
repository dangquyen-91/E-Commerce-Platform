import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cửa hàng",
  description:
    "Khám phá các cửa hàng uy tín trên Digital Marketplace. Xem đánh giá, sản phẩm và lịch sử bán hàng của từng shop.",
  keywords: [
    "cửa hàng uy tín",
    "seller đánh giá cao",
    "shop bán hàng số",
    "đối tác tin cậy",
  ],
  openGraph: {
    title: "Cửa hàng - Digital Marketplace",
    description:
      "Khám phá các cửa hàng uy tín trên Digital Marketplace. Xem đánh giá và sản phẩm của từng shop.",
    type: "website",
  },
};

export default function SellersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
