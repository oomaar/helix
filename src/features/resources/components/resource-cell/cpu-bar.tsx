import { cn } from "@/lib/utils";

type CpuBarProps = { value: number };

export function CpuBar({ value }: CpuBarProps) {
  const tone =
    value >= 85 ? "bg-danger" : value >= 60 ? "bg-warn" : "bg-success";
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="bg-hover h-1.5 w-14 overflow-hidden rounded-full">
        <div
          className={cn("h-full rounded-full", tone)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-text-2 w-8 text-right font-mono text-[11.5px]">
        {value}%
      </span>
    </div>
  );
}
