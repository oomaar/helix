import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 28 | 32;
};

export function IconButton({
  size = 32,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "bg-surface-2 text-text-2 hover:text-text border-border-token hover:border-border-strong focus-visible:ring-brand-line relative inline-flex cursor-pointer items-center justify-center rounded-[8px] border transition-[color,background-color,border-color,transform] focus-visible:ring-2 focus-visible:outline-none active:scale-95 disabled:active:scale-100",
        size === 32 ? "h-8 w-8" : "h-7 w-7",
        className,
      )}
      {...rest}
    />
  );
}
