import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-350 space-y-4 p-[22px_26px_60px]">
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="rounded-panel h-24" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3.5">
        <Skeleton className="rounded-panel col-span-2 h-72" />
        <Skeleton className="rounded-panel h-72" />
      </div>
    </div>
  );
}
