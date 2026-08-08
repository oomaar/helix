import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  /** Shows a spinner and blocks interaction while an action is in flight. */
  loading?: boolean;
};

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white border border-brand hover:bg-brand-2 shadow-[0_2px_8px_-3px_var(--color-brand)]",
  secondary:
    "bg-surface text-text border border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
  ghost:
    "bg-transparent text-text-2 border border-transparent hover:bg-hover hover:text-text",
  danger: "bg-danger text-white border border-danger hover:opacity-90",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[12px] rounded-[7px] gap-1.5",
  md: "h-[34px] px-3.5 text-[12.5px] rounded-[8px] gap-2",
};

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth,
  loading = false,
  disabled,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      // `aria-busy` announces the wait; `disabled` stops a second submit.
      aria-busy={loading || undefined}
      disabled={disabled ?? loading}
      className={cn(
        "focus-visible:ring-brand-line inline-flex cursor-pointer items-center justify-center font-sans font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 12 : 14} /> : null}
      {children}
    </button>
  );
}
