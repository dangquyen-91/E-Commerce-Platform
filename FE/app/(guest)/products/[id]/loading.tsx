import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
      <div className="grid lg:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          {/* Thumbnail Skeleton */}
          <Skeleton className="w-full max-w-xl mx-auto h-64 rounded-2xl" />

          {/* Badges Skeleton */}
          <div className="flex gap-3 flex-wrap">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>

          {/* Title Skeleton */}
          <Skeleton className="h-12 w-full max-w-2xl" />
          <Skeleton className="h-12 w-3/4" />

          {/* Stats Skeleton */}
          <div className="flex gap-4 flex-wrap">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-36" />
          </div>

          {/* Price Skeleton */}
          <Skeleton className="h-16 w-48" />

          {/* Tabs Skeleton */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-28" />
            </div>
            <Skeleton className="h-48 w-full" />
          </div>

          {/* Shop Card Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Skeleton className="h-5 w-20" />
                <div className="flex gap-4 items-center">
                  <Skeleton className="h-11 w-11" />
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-11 w-11" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-28" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-10 w-36" />
                </div>
              </div>
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
