import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warn" | "danger" | "info" | "neutral";

const COLORS: Record<StatusTone, string> = {
  success: "bg-success",
  warn: "bg-warn",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-[var(--color-text-3)]",
};

type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: StatusTone;
  pulse?: boolean;
};

export function StatusDot({
  tone = "neutral",
  pulse = false,
  className,
  ...rest
}: StatusDotProps) {
  return (
    <span
      className={cn(
        "inline-block h-[7px] w-[7px] flex-none rounded-full",
        COLORS[tone],
        pulse && "opacity-90 shadow-[0_0_0_3px_currentColor]",
        className,
      )}
      {...rest}
    />
  );
}
