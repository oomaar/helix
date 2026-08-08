import { cn } from "@/lib/utils";

type SpinnerProps = {
  size?: number;
  className?: string;
  /** Announced to assistive tech; omit inside a control that already says it. */
  label?: string;
};

/**
 * Indeterminate progress ring.
 *
 * Uses Tailwind's built-in `animate-spin` — the rotation is the one piece of
 * motion that is genuinely continuous, so it needs no bespoke keyframe. The
 * track/arc split reads at 12px, which is the size buttons use.
 */
export function Spinner({ size = 14, className, label }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={label ? "status" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("animate-spin", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
