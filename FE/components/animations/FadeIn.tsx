"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ReactNode, useState, useEffect } from "react";

type Direction = "up" | "down" | "left" | "right" | "none";

interface FadeInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
  threshold?: number;
}

const directionOffsets = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
};

export function FadeIn({
  children,
  direction = "up",
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
  threshold = 0.1,
}: FadeInProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render the same on server and initial client render (no animation styles)
  // Only apply animation after component has mounted on client
  if (!mounted) {
    return <div className={className} suppressHydrationWarning>{children}</div>;
  }

  // After mount, check for reduced motion preference
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = directionOffsets[direction];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...offset }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offset }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}
