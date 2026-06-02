import { SkeletonLoader, SkeletonLineLoader } from "@/components/ui/skeleton-loader";
import PageHeader from "@/components/PageHeader";

export const LostFoundSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 md:p-8">
    <PageHeader title="Lost & Found" subtitle="Help recover missing items" />

    {/* Search and filter skeleton */}
    <div className="flex flex-wrap gap-2 mb-4">
      <SkeletonLoader className="flex-1 min-w-[200px] h-10 rounded-full" />
      <div className="flex gap-1.5 flex-wrap">
        {[...Array(3)].map((i) => (
          <SkeletonLoader key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    </div>

    {/* Items skeleton */}
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 flex gap-4">
          <SkeletonLoader className="h-20 w-20 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonLineLoader />
            <SkeletonLineLoader />
            <SkeletonLineLoader />
          </div>
        </div>
      ))}
    </div>
  </div>
);
