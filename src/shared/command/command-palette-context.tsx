"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CommandPalette } from "./command-palette";

type CommandPaletteContextValue = { open: () => void; close: () => void };

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(
  null,
);

export function useCommandPalette(): CommandPaletteContextValue {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) {
    throw new Error(
      "useCommandPalette must be used inside <CommandPaletteProvider>",
    );
  }
  return ctx;
}

export function CommandPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<CommandPaletteContextValue>(
    () => ({ open: () => setOpen(true), close: () => setOpen(false) }),
    [],
  );

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {/* Mounted only while open, so each launch starts with fresh state. */}
      {open ? <CommandPalette onClose={() => setOpen(false)} /> : null}
    </CommandPaletteContext.Provider>
  );
}
