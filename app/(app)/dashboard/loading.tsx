import { Skeleton } from "@/components/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">
      <div className="flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-[92px] rounded-xl" />
        ))}
      </div>

      {/* List + activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}
