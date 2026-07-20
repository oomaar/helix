"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type RenderProps = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

type PopoverProps = {
  /** Trigger element — receives open state + toggle/close handlers. */
  button: (props: RenderProps) => ReactNode;
  /** Panel content — receives `close` so items can dismiss on activation. */
  children: (props: { close: () => void }) => ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
  panelClassName?: string;
  label?: string;
};

/**
 * Lightweight anchored popover: manages open state and closes on outside
 * click, Escape, or route-affecting activation (via the `close` callback).
 * No portal — the panel is absolutely positioned against the trigger, which is
 * all the shell's header/sidebar dropdowns need.
 */
export function Popover({
  button,
  children,
  align = "end",
  side = "bottom",
  className,
  panelClassName,
  label,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {button({ open, toggle, close })}
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className={cn(
            "border-border-strong bg-raised absolute z-50 min-w-55 rounded-[10px] border p-1 shadow-(--shadow-elev-2)",
            side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children({ close })}
        </div>
      ) : null}
    </div>
  );
}
