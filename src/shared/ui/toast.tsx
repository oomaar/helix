"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ToastProps = {
  /** Message to show; `null` renders nothing. */
  message: string | null;
  /** Provided by `useToast` — makes the toast dismissible on click. */
  onDismiss?: () => void;
  className?: string;
};

/**
 * Transient bottom-centered confirmation. Purely presentational — the owner
 * controls visibility (see `useToast` for the usual timeout behaviour).
 *
 * Clicking dismisses it rather than making the user wait out the timer. The
 * container stays click-through so it never blocks the UI underneath.
 */
export function Toast({ message, onDismiss, className }: ToastProps) {
  if (!message) return null;

  const surface = cn(
    "bg-raised border-border-strong text-text rounded-lg border px-4 py-2 text-[12.5px] shadow-(--shadow-elev-2)",
    "animate-slide-up",
    className,
  );

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-100 flex justify-center px-4"
      data-print-hide
    >
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss: ${message}`}
          className={cn(
            surface,
            "pointer-events-auto cursor-pointer transition-transform active:scale-[0.97]",
          )}
        >
          {message}
        </button>
      ) : (
        <div className={surface}>{message}</div>
      )}
    </div>
  );
}

type ToastState = { text: string | null; nonce: number };

/**
 * Message + auto-dismiss timer for `Toast`. The nonce restarts the timer even
 * when the same message is shown twice in a row.
 */
export function useToast(timeoutMs = 3000): {
  message: string | null;
  show: (message: string) => void;
  dismiss: () => void;
} {
  const [state, setState] = useState<ToastState>({ text: null, nonce: 0 });

  useEffect(() => {
    if (!state.text) return;
    const t = setTimeout(() => setState({ text: null, nonce: 0 }), timeoutMs);
    return () => clearTimeout(t);
  }, [state, timeoutMs]);

  return {
    message: state.text,
    show: (text: string) => setState((s) => ({ text, nonce: s.nonce + 1 })),
    dismiss: () => setState({ text: null, nonce: 0 }),
  };
}
