"use client";

import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/shared/hooks/use-focus-trap";

type DrawerProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  className?: string;
};

/**
 * Right-anchored slide-over panel: backdrop, Escape + backdrop dismissal, body
 * scroll lock, and focus return on close. Portaled to the body so it overlays
 * the whole shell.
 */
export function Drawer({
  open,
  onClose,
  children,
  labelledBy,
  className,
}: DrawerProps) {
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

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-100 flex justify-end">
      <div
        className="animate-fade-in absolute inset-0 bg-[color-mix(in_srgb,var(--color-bg)_55%,transparent)] backdrop-blur-[2px]"
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
          "bg-raised border-border-strong animate-slide-in-right relative z-10 flex h-full w-full max-w-md flex-col border-l shadow-(--shadow-elev-2) outline-none",
          className,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
