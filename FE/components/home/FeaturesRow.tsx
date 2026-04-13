"use client";

import { ShoppingBag, Shield, Zap, TrendingUp } from "lucide-react";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations";

const features = [
  {
    icon: ShoppingBag,
    title: "Giao hàng tức thì",
    description: "Nhận license key ngay sau thanh toán",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30",
  },
  {
    icon: Shield,
    title: "Bảo vệ người mua",
    description: "Hệ thống escrow giữ tiền an toàn",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    icon: TrendingUp,
    title: "Đánh giá uy tín",
    description: "Hệ thống Trust Level minh bạch",
    color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
  },
];

export function FeaturesRow() {
  return (
    <section className="py-12 md:py-16 border-y bg-white/5 backdrop-blur-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              THE AMAZING DIGITAL MARKETPLACE OF VIETNAM
            </h2>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {features.map((feature) => (
            <StaggerItem key={feature.title}>
              <div className="flex flex-col items-center text-center space-y-3 p-4">
                <div className={`p-3 rounded-2xl ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
