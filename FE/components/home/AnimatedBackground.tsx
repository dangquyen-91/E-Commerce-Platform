"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <>
      {/* Animated gradient background - covers entire home page */}
      <motion.div
        className="fixed inset-0 -z-10"
        animate={{
          background: [
            "linear-gradient(135deg, #8b5cf6, #ec4899, #f472b6)",
            "linear-gradient(135deg, #ec4899, #f472b6, #fb923c)",
            "linear-gradient(135deg, #f472b6, #fb923c, #8b5cf6)",
            "linear-gradient(135deg, #fb923c, #8b5cf6, #ec4899)",
            "linear-gradient(135deg, #8b5cf6, #ec4899, #f472b6)",
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Animated color blobs - covers entire page */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 200, 0],
            y: [0, 150, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-400/20 to-pink-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -150, 0],
            y: [0, -200, 0],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-yellow-400/15 to-orange-500/15 rounded-full blur-3xl"
          animate={{
            x: [-200, 200, -200],
            y: [-200, 200, -200],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-violet-400/15 to-fuchsia-400/15 rounded-full blur-2xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
    </>
  );
}
