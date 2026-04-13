import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sản phẩm",
  description:
    "Khám phá hàng ngàn sản phẩm số: license key, subscription, tài khoản premium với giá tốt nhất. Netflix, Spotify, Microsoft Office và nhiều hơn nữa.",
  keywords: [
    "mua license key",
    "subscription giá rẻ",
    "tài khoản premium",
    "Netflix premium",
    "Spotify premium",
    "sản phẩm số",
  ],
  openGraph: {
    title: "Sản phẩm số - Digital Marketplace",
    description:
      "Khám phá hàng ngàn sản phẩm số: license key, subscription, tài khoản premium với giá tốt nhất.",
    type: "website",
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
