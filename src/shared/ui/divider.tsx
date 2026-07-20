import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Divider({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("bg-border-token h-px w-full", className)}
      role="separator"
      {...rest}
    />
  );
}
