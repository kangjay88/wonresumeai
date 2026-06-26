import { Skeleton } from "@/components/skeleton";

export default function ResumeLoading() {
  return (
    <div className="flex h-screen flex-col p-6">
      <div className="flex items-center justify-between border-b border-line px-2 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-6 pt-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
        <Skeleton className="hidden h-full w-full rounded-md lg:block" />
      </div>
    </div>
  );
}
