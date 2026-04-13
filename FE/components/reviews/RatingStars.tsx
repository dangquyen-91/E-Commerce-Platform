"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showValue = false,
  className,
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const displayRating = interactive && hoverRating > 0 ? hoverRating : rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => {
          const value = index + 1;
          const isFilled = value <= displayRating;
          const isHalfFilled = !isFilled && value - 0.5 <= displayRating;

          return (
            <button
              key={index}
              type="button"
              disabled={!interactive}
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              className={cn(
                "relative transition-transform",
                interactive && "cursor-pointer hover:scale-110",
                !interactive && "cursor-default"
              )}
            >
              {/* Background star (empty) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "text-muted-foreground/30 stroke-muted-foreground/50"
                )}
              />
              {/* Foreground star (filled) */}
              <Star
                className={cn(
                  sizeClasses[size],
                  "absolute inset-0 text-yellow-400 fill-yellow-400 transition-all",
                  isFilled && "opacity-100",
                  isHalfFilled && "opacity-100 [clip-path:inset(0_50%_0_0)]",
                  !isFilled && !isHalfFilled && "opacity-0"
                )}
              />
            </button>
          );
        })}
      </div>
      {showValue && (
        <span
          className={cn(
            "font-medium text-muted-foreground ml-1",
            textSizeClasses[size]
          )}
        >
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
