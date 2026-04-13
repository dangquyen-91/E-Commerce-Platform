"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
  gradient?: string;
  className?: string;
  description?: string;
  variant?: "default" | "compact" | "featured" | "carousel";
}

export function ProductCard({
  id,
  name,
  price,
  image,
  gradient = "from-violet-400 via-fuchsia-400 to-pink-400",
  className = "",
  description,
  variant = "default",
}: ProductCardProps) {
  // Variant-specific styles
  const imageHeight =
    variant === "featured" ? "h-32" : variant === "compact" ? "h-20" : "h-40";
  const cardPadding = variant === "compact" ? "p-2" : "p-4";
  const titleSize = variant === "compact" ? "text-xs" : "text-sm";
  const buttonSize =
    variant === "compact" ? "text-[10px] px-2 py-1 h-6" : "text-xs px-3 py-1.5 h-7";

  const hasImage = image && image.trim() !== "";
  const isDataUrl = !!(hasImage && image.startsWith("data:"));
  const [imageError, setImageError] = useState(false);

  if (variant === "carousel") {
    return (
      <Link
        href={`/products/${id}`}
        prefetch={true}
        className={`group relative block overflow-visible rounded-2xl ${className}`}
      >
        <div className="">
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-neutral-950/70 shadow-md">
            <div className={`w-full bg-gradient-to-br ${gradient} p-3`}>
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-white/5 flex items-center justify-center">
                {hasImage && !imageError ? (
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, 300px"
                    unoptimized={isDataUrl}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-white/60 font-bold text-5xl">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded card (hover): image on top + content panel below */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto z-50">
          <div className="overflow-hidden rounded-2xl border-0 bg-neutral-950/80 shadow-2xl">
            <div className={`w-full bg-gradient-to-br ${gradient} p-3`}>
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-white/5 flex items-center justify-center">
                {hasImage && !imageError ? (
                  <Image
                    src={image}
                    alt={name}
                    fill
                    className="object-contain"
                    sizes="420px"
                    unoptimized={isDataUrl}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <span className="text-white/60 font-bold text-5xl">
                    {name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-700/70 to-slate-800/70 px-5 pb-5 pt-4">
              <p className="text-lg font-bold text-white line-clamp-2">{name}</p>
              <p className="mt-1 text-sm text-white/75 line-clamp-2">
                {description || "Sản phẩm hot trong danh mục này"}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <Button
                  size="sm"
                  className="h-10 px-5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
                  onClick={(e) => e.preventDefault()}
                >
                  Mua ngay
                </Button>
                <div className="ml-auto text-lg font-bold text-white">
                  {price.toLocaleString("vi-VN")}đ
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/products/${id}`}
      prefetch={true}
      className={`group relative flex flex-col h-full backdrop-blur-md bg-white/90 border border-white/20 rounded-lg overflow-hidden hover:shadow-lg hover:border-violet-300 transition-all duration-200 ${className}`}
    >
      {/* Image - Improved display with better height and full image support */}
      <div
        className={`${imageHeight} w-full bg-gradient-to-br ${gradient} relative overflow-hidden flex-shrink-0 flex items-center justify-center`}
      >
        {/* Product Image - Always render when image URL exists */}
        {hasImage && !imageError && (
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300 z-20"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            unoptimized={isDataUrl}
            onError={() => {
              // Fallback to gradient if image fails to load
              setImageError(true);
            }}
          />
        )}
        {/* Fallback gradient with initial - Only show when no image or image failed */}
        {(!hasImage || imageError) && (
          <div className="image-fallback absolute inset-0 bg-gradient-to-br from-white/20 to-transparent flex items-center justify-center z-10">
            <span className="text-white/60 font-bold text-2xl">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`${cardPadding} flex flex-col flex-1 min-h-0`}>
        {/* Name */}
        <h3
          className={`${titleSize} font-medium text-foreground line-clamp-2 mb-2 group-hover:text-violet-600 transition-colors leading-tight flex-1`}
        >
          {name}
        </h3>

        {/* Price & Button */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <p className={`${titleSize} font-bold text-foreground truncate`}>{price.toLocaleString("vi-VN")}đ</p>
          <Button
            size="sm"
            className={`bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 rounded-full ${buttonSize} flex-shrink-0`}
            onClick={(e) => e.preventDefault()}
          >
            Mua ngay
          </Button>
        </div>
      </div>
    </Link>
  );
}
