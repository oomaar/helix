import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  actions?: React.ReactNode;
};

/** Standard title bar used at the top of every screen. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...rest
}: PageHeaderProps) {
  return (
    <div className={cn("mb-5 flex items-end gap-4", className)} {...rest}>
      <div className="min-w-0 flex-1">
        <h1 className="text-text m-0 text-[20px] font-bold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-text-2 m-0 mt-0.5 text-[13px]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
