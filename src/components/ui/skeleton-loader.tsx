import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => {
  return (
    <div
      className={cn(
        "bg-secondary/50 rounded-lg animate-pulse",
        className
      )}
    />
  );
};

export const SkeletonLineLoader = () => (
  <SkeletonLoader className="h-4 w-full mb-2" />
);

export const SkeletonCircleLoader = () => (
  <SkeletonLoader className="h-12 w-12 rounded-full" />
);

export const SkeletonCardLoader = () => (
  <div className="glass rounded-2xl p-4 space-y-3">
    <SkeletonCircleLoader />
    <SkeletonLineLoader />
    <SkeletonLineLoader />
  </div>
);
