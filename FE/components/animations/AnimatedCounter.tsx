"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({
  value,
  suffix = "",
  prefix = "",
  duration = 2,
  className = "",
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  const spring = useSpring(0, {
    damping: 30,
    stiffness: 100,
    duration: duration * 1000,
  });

  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    if (inView && !prefersReducedMotion) {
      spring.set(value);
    } else if (prefersReducedMotion) {
      setDisplayValue(value.toLocaleString());
    }
  }, [inView, value, spring, prefersReducedMotion]);

  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      setDisplayValue(v);
    });
    return () => unsubscribe();
  }, [display]);

  if (prefersReducedMotion) {
    return (
      <span className={className}>
        {prefix}{value.toLocaleString()}{suffix}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={className}>
      {prefix}{displayValue}{suffix}
    </motion.span>
  );
}
