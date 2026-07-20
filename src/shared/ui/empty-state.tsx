import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-text-2 flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="bg-surface-2 text-text-3 border-border-token flex h-11 w-11 items-center justify-center rounded-full border">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <div className="text-text text-[14px] font-semibold">{title}</div>
        {description ? (
          <p className="text-text-3 max-w-sm text-[12.5px]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
