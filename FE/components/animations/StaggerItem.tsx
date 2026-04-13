"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className = "" }: StaggerItemProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();

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
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: "easeOut" },
        },
      }}
      className={className}
      suppressHydrationWarning
    >
      {children}
    </motion.div>
  );
}
