"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { HeroSection, FeaturesRow } from "@/components/home";

// Dynamic imports for below-the-fold components to reduce initial bundle size
// and improve First Contentful Paint (FCP)

const AnimatedBackground = dynamic(
  () => import("@/components/home/AnimatedBackground").then((mod) => mod.AnimatedBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500" />
    ),
  }
);

// FeaturedProducts - loads products from API, lazy-load for faster initial render
const FeaturedProducts = dynamic(
  () => import("@/components/home/FeaturedProducts").then((mod) => mod.FeaturedProducts),
  {
    loading: () => (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 mx-auto mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    ),
  }
);

// CategoryFilter - below the fold
const CategoryFilter = dynamic(
  () => import("@/components/home/CategoryFilter").then((mod) => mod.CategoryFilter),
  {
    loading: () => (
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-40 mx-auto mb-8" />
          <div className="flex gap-4 justify-center flex-wrap">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-full" />
            ))}
          </div>
        </div>
      </section>
    ),
  }
);

// CTASection - at the bottom of the page
const CTASection = dynamic(
  () => import("@/components/home/CTASection").then((mod) => mod.CTASection),
  {
    loading: () => (
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </section>
    ),
  }
);

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated gradient background - dynamically loaded */}
      <AnimatedBackground />

      {/* Content - Centered */}
      <div className="relative z-0 flex flex-col">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Row */}
        <FeaturesRow />

        {/* Featured Products */}
        <FeaturedProducts />

        {/* Category Filter & Products */}
        <CategoryFilter />

        {/* CTA Section */}
        <CTASection />
      </div>
    </div>
  );
}
