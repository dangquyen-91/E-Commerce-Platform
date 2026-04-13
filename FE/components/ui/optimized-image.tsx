"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  fallback,
  priority = false,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  quality = 75,
}: OptimizedImageProps) {
  const [error, setError] = useState(false);

  if (!src || error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className={cn("bg-muted flex items-center justify-center", className)}>
        <span className="text-muted-foreground text-xs">No image</span>
      </div>
    );
  }

  // Check if it's an external URL or local
  const isExternal = src.startsWith("http://") || src.startsWith("https://");

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={cn("object-cover", className)}
        onError={() => setError(true)}
        priority={priority}
        sizes={sizes}
        quality={quality}
        unoptimized={!isExternal && process.env.NODE_ENV === "development"}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width || 200}
      height={height || 200}
      className={className}
      onError={() => setError(true)}
      priority={priority}
      sizes={sizes}
      quality={quality}
      unoptimized={!isExternal && process.env.NODE_ENV === "development"}
    />
  );
}
