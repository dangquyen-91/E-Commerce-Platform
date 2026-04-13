"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FadeIn, StaggerItem } from "@/components/animations";
import { ProductCard } from "./ProductCard";
import {
  ArrowRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useProducts } from "@/lib/hooks/useProducts";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

/* Gradient presets */
const gradients = [
  "from-violet-400 to-pink-400",
  "from-orange-400 to-yellow-300",
  "from-cyan-400 to-blue-400",
  "from-pink-400 to-rose-400",
  "from-emerald-400 to-teal-400",
  "from-amber-400 to-orange-400",
];

export function CategoryFilter() {
  const { products, loading, error } = useProducts({
    initialFilter: { limit: 8 },
    autoFetch: true,
  });

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "center",
      loop: true,
      slidesToScroll: 1,
      containScroll: "trimSnaps",
    },
    [
      Autoplay({
        delay: 3500,
        stopOnInteraction: true,
        stopOnMouseEnter: true,
      }),
    ]
  );

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [snapCount, setSnapCount] = useState(0);

  const updateScrollButtons = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setSnapCount(emblaApi.scrollSnapList().length);
  }, [emblaApi]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    updateScrollButtons();
    emblaApi.on("select", updateScrollButtons);
    emblaApi.on("reInit", updateScrollButtons);
    return () => {
      emblaApi.off("select", updateScrollButtons);
      emblaApi.off("reInit", updateScrollButtons);
    };
  }, [emblaApi, updateScrollButtons]);

  return (
    <section className="py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn direction="up">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              KHÁM PHÁ THÊM
            </h2>
            <p className="text-muted-foreground mt-2">
              Những sản phẩm nổi bật dành cho bạn
            </p>
          </div>
        </FadeIn>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <p>Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
          </div>
        )}

        {/* Mobile / Tablet Grid */}
        {!loading && !error && products.length > 0 && (
          <div className="block lg:hidden">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {products.map((product, index) => (
                <StaggerItem key={product._id || product.id}>
                  <ProductCard
                    id={product._id || product.id || ""}
                    name={product.title}
                    price={product.price}
                    image={product.thumbnailUrl || undefined}
                    gradient={gradients[index % gradients.length]}
                    variant="default"
                    className="shadow-md"
                  />
                </StaggerItem>
              ))}
            </div>
          </div>
        )}

        {/* Desktop Carousel */}
        {!loading && !error && products.length > 0 && (
          <div className="hidden lg:block">
            <div className="relative">
              <div ref={emblaRef}>
                <div className="flex -ml-6 py-8 items-center">
                  {products.map((product, index) => (
                    <div
                      key={product._id || product.id}
                      className={`pl-6 flex-[0_0_33.3333%] transition-all duration-300 ${
                        Math.abs(index - selectedIndex) === 0
                          ? "opacity-100 scale-100 z-20"
                          : Math.abs(index - selectedIndex) === 1
                          ? "opacity-40 scale-90 z-10"
                          : "opacity-0 scale-75 pointer-events-none"
                      }`}
                    >
                      <ProductCard
                        id={product._id || product.id || ""}
                        name={product.title}
                        price={product.price}
                        image={product.thumbnailUrl || undefined}
                        gradient={gradients[index % gradients.length]}
                        variant="carousel"
                        description="Sản phẩm nổi bật"
                        className="shadow-md"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button
                size="icon"
                variant="outline"
                className="absolute -left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-md"
                onClick={scrollPrev}
                disabled={!canScrollPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                variant="outline"
                className="absolute -right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-md"
                onClick={scrollNext}
                disabled={!canScrollNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && products.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p>Chưa có sản phẩm nào.</p>
          </div>
        )}

        {/* View All */}
        <FadeIn direction="up" delay={0.3}>
          <div className="text-center mt-10">
            <Button variant="outline" size="lg" className="rounded-full h-12 px-8" asChild>
              <Link href="/products">
                Xem tất cả sản phẩm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
