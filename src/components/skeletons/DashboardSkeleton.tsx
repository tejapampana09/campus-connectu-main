import { SkeletonLoader, SkeletonLineLoader } from "@/components/ui/skeleton-loader";
import PageHeader from "@/components/PageHeader";

export const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto p-4 md:p-8">
    {/* Hero Skeleton */}
    <div className="glass-strong rounded-3xl p-6 md:p-8 mb-6">
      <div className="flex items-center gap-4 md:gap-6">
        <SkeletonLoader className="h-16 w-16 md:h-20 md:w-20 rounded-2xl" />
        <div className="flex-1 min-w-0 space-y-2">
          <SkeletonLineLoader />
          <SkeletonLoader className="h-8 w-1/2" />
          <SkeletonLineLoader />
        </div>
      </div>
    </div>

    {/* Trending Skeleton */}
    <div className="mb-6">
      <SkeletonLineLoader />
      <div className="flex flex-wrap gap-2 mt-2">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={i} className="h-6 w-24" />
        ))}
      </div>
    </div>

    {/* Quick nav skeleton */}
    <PageHeader title="Quick navigation" subtitle="Jump anywhere in your campus" />
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 md:p-5 space-y-3">
          <SkeletonLoader className="h-10 w-10 rounded-xl" />
          <SkeletonLineLoader />
          <SkeletonLineLoader />
        </div>
      ))}
    </div>
  </div>
);
