"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { FadeIn } from "@/components/animations";
import { motion } from "framer-motion";

export function CTASection() {
  return (
    <section className="py-12 md:py-16 lg:py-20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Floating Images */}
          <FadeIn direction="right" delay={0.2}>
            <div className="relative h-[320px] hidden lg:flex justify-center items-center overflow-hidden">
            <div className="relative w-[400px] h-[350px] translate-x-[40%]">

                <motion.div
                  className="absolute left-0 top-0 w-48 h-48 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-400 shadow-xl overflow-hidden"
                  animate={{ y: [0, -15, 0], rotate: [-2, 2, -2] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />

                <motion.div
                  className="absolute left-32 top-12 w-56 h-56 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-400 shadow-xl overflow-hidden z-10"
                  animate={{ y: [0, 10, 0], rotate: [2, -2, 2] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                />

                <motion.div
                  className="absolute left-8 top-52 w-44 h-44 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-xl overflow-hidden"
                  animate={{ y: [0, -10, 0], rotate: [-1, 1, -1] }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                />

                <motion.div
                  className="absolute left-48 bottom-0 w-40 h-52 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl overflow-hidden"
                  animate={{ y: [0, 12, 0], rotate: [1, -1, 1] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                />

                <div className="absolute left-20 top-40 flex -space-x-3 z-20">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeIn>


          {/* Right: Content */}
          <FadeIn direction="left" delay={0.3}>
            <div className="space-y-6 lg:pl-2222 xl:pl-35">

              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground leading-tight">
                BẮT ĐẦU BÁN
                <br />
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  SẢN PHẨM SỐ
                </span>
                <br />
                CỦA BẠN
              </h2>

              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Đăng ký làm seller, tạo shop của bạn và tiếp cận hàng nghìn khách hàng tiềm năng.
                Hệ thống hỗ trợ thanh toán an toàn và quản lý sản phẩm dễ dàng.
              </p>

              <ul className="space-y-3 text-muted-foreground">
                {[
                  "Miễn phí đăng ký và tạo shop",
                  "Hoa hồng cạnh tranh chỉ từ 5%",
                  "Thanh toán nhanh chóng trong 24h",
                  "Hỗ trợ marketing và quảng bá",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Button
                  size="lg"
                  className="h-14 px-10 text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all duration-300 rounded-full group"
                  asChild
                >
                  <Link href="/seller/register">
                    Đăng ký ngay
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
