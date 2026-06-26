import { CardSkeleton, Skeleton } from "@/components/skeleton";

export default function ApplicationLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>

      <Skeleton className="h-14 w-full rounded-xl" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}
