import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Danh mục sản phẩm",
  description:
    "Duyệt theo nền tảng: Netflix, Spotify, Microsoft Office, Adobe, Canva và nhiều dịch vụ phổ biến khác. Tìm sản phẩm số phù hợp với nhu cầu của bạn.",
  keywords: [
    "danh mục sản phẩm số",
    "nền tảng streaming",
    "phần mềm bản quyền",
    "Netflix",
    "Spotify",
    "Microsoft",
    "Adobe",
  ],
  openGraph: {
    title: "Danh mục sản phẩm - Digital Marketplace",
    description:
      "Duyệt theo nền tảng: Netflix, Spotify, Microsoft Office, Adobe và nhiều dịch vụ phổ biến khác.",
    type: "website",
  },
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
