"use client";

import { useEffect, useState } from "react";
import { AnomaliesIcon, CheckIcon } from "@/shared/icons";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { cn } from "@/lib/utils";

/**
 * Connectivity banner pinned under the top bar.
 *
 * Shows while offline, then flips to a brief "back online" confirmation so the
 * recovery is acknowledged rather than the banner just vanishing.
 */
export function OfflineBanner() {
  const online = useOnlineStatus();
  const [recovered, setRecovered] = useState(false);
  const [previousOnline, setPreviousOnline] = useState(online);

  // Adjust during render on a connectivity transition — the state derives from
  // a change in `online`, so an effect would just add a wasted extra paint.
  if (previousOnline !== online) {
    setPreviousOnline(online);
    setRecovered(online);
  }

  useEffect(() => {
    if (!recovered) return;
    const t = setTimeout(() => setRecovered(false), 4000);
    return () => clearTimeout(t);
  }, [recovered]);

  if (online && !recovered) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-print-hide
      className={cn(
        "flex flex-none items-center justify-center gap-2 border-b",
        "px-4 py-1.5 text-[12px] font-medium",
        "animate-fade-in",
        online
          ? "bg-success-soft text-success border-[color-mix(in_srgb,var(--color-success)_35%,transparent)]"
          : "bg-warn-soft text-warn border-[color-mix(in_srgb,var(--color-warn)_45%,transparent)]",
      )}
    >
      {online ? (
        <>
          <CheckIcon size={14} strokeWidth={2.4} />
          Back online — reloading the latest data.
        </>
      ) : (
        <>
          <AnomaliesIcon size={14} />
          You&rsquo;re offline. Changes are paused until the connection returns.
        </>
      )}
    </div>
  );
}
