"use client";

import { FadeIn } from "@/components/animations";
import { ProductCard } from "./ProductCard";
import { TopProducts } from "./TopProducts";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useFeaturedProducts } from "@/lib/hooks/useProducts";

// Gradient presets
const gradients = [
  "from-violet-400 via-fuchsia-400 to-pink-400",
  "from-pink-400 via-rose-400 to-orange-300",
  "from-cyan-400 via-blue-400 to-violet-400",
  "from-emerald-400 via-teal-400 to-cyan-400",
];

export function FeaturedProducts() {
  const { products, loading, error } = useFeaturedProducts(4);

  return (
    <section className="py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="flex items-center justify-between mb-8">
            {/* Align heading block width with CategoryFilter header so titles line up */}
            <div className="w-full lg:max-w-[calc(100%-140px)]">
              <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                SẢN PHẨM NỔI BẬT
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex items-center gap-2 rounded-full"
              asChild
            >
              <Link href="/products">
                Xem tất cả
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16 text-white/90 drop-shadow-md">
            <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 min-h-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full auto-rows-fr">
                {products.slice(0, 4).map((product, index) => {
                  const platform = typeof product.platformId === "object" ? product.platformId : null;
                  const thumbnailUrl = (product as any).thumbnailUrl || product.thumbnailUrl || null;
                  const platformLogoUrl = platform ? (platform as any)?.logoUrl : null;

                  let imageUrl: string | undefined = undefined;
                  if (thumbnailUrl && typeof thumbnailUrl === "string" && thumbnailUrl.trim() !== "") {
                    imageUrl = thumbnailUrl.trim();
                  } else if (
                    platformLogoUrl &&
                    typeof platformLogoUrl === "string" &&
                    platformLogoUrl.trim() !== ""
                  ) {
                    imageUrl = platformLogoUrl.trim();
                  }

                  return (
                    <div
                      key={product._id || product.id || index}
                      className="h-full rounded-2xl overflow-hidden backdrop-blur-md bg-white/10 border border-white/20 shadow-2xl"
                    >
                      <ProductCard
                        id={product._id || product.id || ""}
                        name={product.title}
                        price={product.price}
                        image={imageUrl}
                        gradient={gradients[index % gradients.length]}
                        variant="default"
                        className="h-full"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-1 min-h-full">
              <TopProducts />
            </div>
          </div>
        )}

        {!loading && !error && products.length === 0 && (
          <div className="text-center py-16 text-white/90 drop-shadow-md">
            <p>Chưa có sản phẩm nào.</p>
          </div>
        )}

        <div className="mt-6 text-center md:hidden">
          <Button variant="outline" size="sm" className="rounded-full" asChild>
            <Link href="/products">
              Xem tất cả sản phẩm
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
