import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

/** Filter chip / segmented option used in tables and filter bars. */
export function Chip({
  active = false,
  className,
  type = "button",
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      className={cn(
        "h-[30px] cursor-pointer rounded-[7px] border px-3 text-[12px] font-medium transition-colors",
        active
          ? "border-brand bg-brand-soft text-brand font-semibold"
          : "bg-surface text-text-2 border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        className,
      )}
      {...rest}
    />
  );
}
