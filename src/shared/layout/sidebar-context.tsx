"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SidebarContextValue = {
  open: boolean;
  toggle: () => void;
  close: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) {
    throw new Error("useSidebar must be used inside <SidebarProvider>");
  }
  return ctx;
}

/**
 * Controls the mobile navigation drawer. On large screens the sidebar is a
 * static rail and this state is simply ignored. Closes on Escape and on
 * navigation (nav links call `close`), and locks body scroll while open.
 */
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  const value = useMemo<SidebarContextValue>(
    () => ({
      open,
      toggle: () => setOpen((o) => !o),
      close: () => setOpen(false),
    }),
    [open],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}
