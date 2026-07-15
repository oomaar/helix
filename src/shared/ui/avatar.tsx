import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { initials as toInitials } from "@/lib/utils";

type AvatarProps = HTMLAttributes<HTMLDivElement> & {
  name: string;
  size?: 24 | 26 | 30 | 36;
  /** Solid background (defaults to a deterministic gradient). */
  color?: string;
};

const SIZES: Record<NonNullable<AvatarProps["size"]>, string> = {
  24: "w-6 h-6 text-[10px]",
  26: "w-[26px] h-[26px] text-[10.5px]",
  30: "w-[30px] h-[30px] text-[12px]",
  36: "w-9 h-9 text-[13px]",
};

const GRADIENTS = [
  "linear-gradient(135deg,#f4677a,#e0a13a)",
  "linear-gradient(135deg,#6b78f0,#8a94f5)",
  "linear-gradient(135deg,#3ecf8e,#5aa9e6)",
  "linear-gradient(135deg,#e0a13a,#f4677a)",
  "linear-gradient(135deg,#4b57e0,#6b78f0)",
];

function pickGradient(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1)
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

export function Avatar({
  name,
  size = 30,
  color,
  className,
  style,
  ...rest
}: AvatarProps) {
  return (
    <div
      className={cn(
        "flex flex-none items-center justify-center rounded-full font-semibold text-white select-none",
        SIZES[size],
        className,
      )}
      style={{ background: color ?? pickGradient(name), ...style }}
      aria-label={name}
      {...rest}
    >
      {toInitials(name)}
    </div>
  );
}
