import { SkeletonLoader, SkeletonLineLoader, SkeletonCircleLoader } from "@/components/ui/skeleton-loader";
import PageHeader from "@/components/PageHeader";

export const ProfileSkeleton = () => (
  <div className="max-w-3xl mx-auto p-4 md:p-8">
    <PageHeader title="Your profile" subtitle="Let your campus know who you are" />

    {/* Avatar section skeleton */}
    <div className="glass-strong rounded-3xl p-6 mb-6 flex items-center gap-5">
      <SkeletonCircleLoader />
      <div className="flex-1">
        <SkeletonLineLoader />
        <SkeletonLineLoader />
        <SkeletonLoader className="h-8 w-24 mt-2" />
      </div>
    </div>

    {/* Form skeleton */}
    <div className="glass rounded-2xl p-5 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i}>
          <SkeletonLineLoader />
          <SkeletonLoader className="h-10 w-full mt-1" />
        </div>
      ))}
      <SkeletonLoader className="h-12 w-full rounded-full" />
    </div>
  </div>
);
