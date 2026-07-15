import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  "neutral" | "brand" | "success" | "warn" | "danger" | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  mono?: boolean;
};

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-text-3 border border-[var(--color-border)]",
  brand: "bg-brand-soft text-brand border border-[var(--color-brand-line)]",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

export function Badge({
  tone = "neutral",
  mono = true,
  className,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-[1px] text-[10px] font-semibold",
        mono && "font-mono",
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
