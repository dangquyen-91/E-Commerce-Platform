import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { RoleRedirect } from "@/components/auth/RoleRedirect";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ChatProvider } from "@/components/chat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Digital Marketplace - Sàn thương mại sản phẩm số",
    template: "%s | Digital Marketplace",
  },
  description:
    "Nền tảng mua bán license key, subscription và sản phẩm số uy tín. Đa dạng sản phẩm từ Netflix, Spotify, Microsoft Office đến các phần mềm chuyên dụng.",
  keywords: [
    "license key",
    "subscription",
    "sản phẩm số",
    "Netflix",
    "Spotify",
    "Microsoft Office",
    "phần mềm bản quyền",
    "mua bán online",
  ],
  authors: [{ name: "Digital Marketplace" }],
  creator: "Digital Marketplace",
  publisher: "Digital Marketplace",
  formatDetection: {
    email: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://digitalmarketplace.vn"),
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "Digital Marketplace",
    title: "Digital Marketplace - Sàn thương mại sản phẩm số",
    description:
      "Nền tảng mua bán license key, subscription và sản phẩm số uy tín",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digital Marketplace - Sàn thương mại sản phẩm số",
    description:
      "Nền tảng mua bán license key, subscription và sản phẩm số uy tín",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>
            <RoleRedirect publicRoutes={["/products", "/categories", "/sellers", "/login", "/register"]}>
              <ConditionalLayout>{children}</ConditionalLayout>
            </RoleRedirect>
            <Toaster />
            <ChatProvider />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
