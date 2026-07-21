import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui";

type SectionCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <Card as="section" className={cn("min-w-0", className)}>
      <div className="flex items-center gap-3 px-4.5 pt-3.75 pb-3">
        <div className="text-text flex-1 text-[14px] font-semibold">
          {title}
        </div>
        {action ? <div className="flex-none">{action}</div> : null}
      </div>
      <div className={cn("px-4.5 pb-4", bodyClassName)}>{children}</div>
    </Card>
  );
}
