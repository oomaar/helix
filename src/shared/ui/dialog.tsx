"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/shared/hooks/use-focus-trap";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
  /** Vertical placement of the panel from the top of the viewport. */
  align?: "center" | "top";
};

/**
 * Accessible modal overlay rendered in a portal: backdrop, Escape + backdrop
 * dismissal, body scroll lock, and focus return to the previously focused
 * element on close. Content owns its own initial focus (e.g. an autofocused
 * input).
 */
export function Dialog({
  open,
  onClose,
  children,
  className,
  labelledBy,
  align = "top",
}: DialogProps) {
  const restoreRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  useFocusTrap(panelRef, open);

  // The portal only ever renders after a client interaction opens it, so it
  // never runs during SSR — no mounted gate needed.
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-100 flex justify-center px-4",
        align === "top" ? "items-start pt-[12vh]" : "items-center",
      )}
    >
      <div
        className="absolute inset-0 bg-[color-mix(in_srgb,var(--color-bg)_60%,transparent)] backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          "border-border-strong bg-raised rounded-panel relative z-10 w-full max-w-140 border shadow-(--shadow-elev-2) outline-none",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
