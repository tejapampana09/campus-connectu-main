import { SkeletonLoader, SkeletonLineLoader, SkeletonCircleLoader } from "@/components/ui/skeleton-loader";
import PageHeader from "@/components/PageHeader";

export const GroupsSkeleton = () => (
  <div className="max-w-4xl mx-auto p-4 md:p-8">
    <PageHeader title="Groups" subtitle="Chatrooms for everyone" />

    {/* Create button skeleton */}
    <div className="flex gap-2 mb-5">
      <SkeletonLoader className="h-8 flex-1 rounded-full" />
    </div>

    {/* Groups list skeleton */}
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-3 flex items-center gap-3">
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
