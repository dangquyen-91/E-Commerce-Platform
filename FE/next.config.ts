import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      // Bing images (thumbnails from search)
      {
        protocol: "https",
        hostname: "th.bing.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.bing.com",
        pathname: "/**",
      },
      // Common image CDNs - allow any external images
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
    // Optimize for Vercel
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },

  // Compression
  compress: true,

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Optimize bundle - tree shake large packages
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-icons",
      "date-fns",
      "framer-motion",
      "socket.io-client",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
    ],
  },

  // Note: In production on Vercel, API routes are handled by vercel.json routing
  // Only use rewrites for local development
  async rewrites() {
    // Only apply rewrites in development
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          destination:
            process.env.NEXT_PUBLIC_API_URL ||
            process.env.API_URL ||
            "http://localhost:3001/api/:path*",
        },
      ];
    }
    // In production, Vercel routing handles /api/* -> backend serverless function
    return [];
  },
};

export default nextConfig;
