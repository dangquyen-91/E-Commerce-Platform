"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { ReactNode, useState, useEffect } from "react";

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
  once?: boolean;
  threshold?: number;
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.1,
  initialDelay = 0.1,
  once = true,
  threshold = 0.1,
}: StaggerContainerProps) {
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

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          },
        },
      }}
      className={className}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}
