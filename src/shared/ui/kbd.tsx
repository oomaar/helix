import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Keyboard shortcut hint — mirrors the `⌘K` glyph in the header. */
export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "text-text-2 bg-surface inline-flex items-center rounded border border-[var(--color-border)] px-[5px] py-[1px] font-mono text-[10.5px]",
        className,
      )}
      {...rest}
    />
  );
}
