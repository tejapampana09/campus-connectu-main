import { SkeletonLoader, SkeletonLineLoader, SkeletonCircleLoader } from "@/components/ui/skeleton-loader";
import PageHeader from "@/components/PageHeader";

export const FriendsSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 md:p-8">
    <PageHeader title="Friends" subtitle="Your campus network" />

    {/* Tabs skeleton */}
    <div className="flex gap-2 mb-5">
      {[1, 2, 3].map((i) => (
        <SkeletonLoader key={i} className="h-8 flex-1 md:flex-none md:w-24 rounded-full" />
      ))}
    </div>

    {/* Friends list skeleton */}
    <div className="grid sm:grid-cols-2 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-4 flex items-center gap-3">
          <SkeletonCircleLoader />
          <div className="flex-1">
            <SkeletonLineLoader />
            <SkeletonLineLoader />
          </div>
          <SkeletonLoader className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);
