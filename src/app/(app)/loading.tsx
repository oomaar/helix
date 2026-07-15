import { Skeleton } from "@/shared/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-4 p-[22px_26px_60px]">
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-5 gap-3.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[11px]" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3.5">
        <Skeleton className="col-span-2 h-72 rounded-[11px]" />
        <Skeleton className="h-72 rounded-[11px]" />
      </div>
    </div>
  );
}
