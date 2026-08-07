import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FormSectionProps = {
  title?: string;
  description?: ReactNode;
  /** Right-aligned slot for a toggle or secondary action. */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Titled group of related fields inside a step or a single-page form. */
export function FormSection({
  title,
  description,
  actions,
  children,
  className,
}: FormSectionProps) {
  return (
    <section className={cn("space-y-3", className)}>
      {title || actions ? (
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {title ? (
              <h4 className="text-text text-[12.5px] font-semibold">{title}</h4>
            ) : null}
            {description ? (
              <p className="text-text-3 mt-0.5 text-[11.5px]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex-none">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Responsive two-column field grid; collapses to one column when narrow. */
export function FormRow({
  children,
  cols = 2,
  className,
}: {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-3",
        cols === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
