import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Input({ leading, trailing, className, ...rest }: InputProps) {
  return (
    <div
      className={cn(
        "bg-surface flex h-8 items-center gap-2 rounded-[8px] border border-[var(--color-border)] px-2.5 focus-within:border-[var(--color-brand-line)] focus-within:ring-2 focus-within:ring-[var(--color-brand-soft)]",
        className,
      )}
    >
      {leading ? (
        <span className="text-text-3 flex-none">{leading}</span>
      ) : null}
      <input
        className="text-text placeholder:text-text-3 min-w-0 flex-1 border-none bg-transparent font-sans text-[12.5px] outline-none"
        {...rest}
      />
      {trailing ? (
        <span className="text-text-3 flex-none">{trailing}</span>
      ) : null}
    </div>
  );
}
