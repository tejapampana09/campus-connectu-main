import { SkeletonLoader, SkeletonLineLoader } from "@/components/ui/skeleton-loader";
import PageHeader from "@/components/PageHeader";

export const MarketplaceSkeleton = () => (
  <div className="max-w-6xl mx-auto p-4 md:p-8">
    <PageHeader title="Campus Marketplace" subtitle="Buy & sell within SRM AP" />

    {/* Search and filter skeleton */}
    <div className="flex flex-wrap gap-2 mb-4">
      <SkeletonLoader className="flex-1 min-w-[200px] h-10 rounded-full" />
      <div className="flex gap-1.5 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <SkeletonLoader key={i} className="h-8 w-16 rounded-full" />
        ))}
      </div>
    </div>

    {/* Items skeleton */}
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="glass rounded-2xl overflow-hidden">
          <SkeletonLoader className="w-full h-40" />
          <div className="p-4 space-y-3">
            <SkeletonLineLoader />
            <SkeletonLineLoader />
            <SkeletonLineLoader />
            <div className="flex justify-between pt-2">
              <SkeletonLoader className="h-6 w-20" />
              <SkeletonLoader className="h-6 w-6 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
