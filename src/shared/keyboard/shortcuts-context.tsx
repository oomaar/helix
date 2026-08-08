"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { NAV_GROUPS } from "@/shared/nav/nav-config";
import { useSession } from "@/shared/session";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { useGlobalShortcuts } from "./use-global-shortcuts";

type ShortcutsContextValue = { openGuide: () => void };

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function useShortcuts(): ShortcutsContextValue {
  const ctx = useContext(ShortcutsContext);
  if (!ctx) {
    throw new Error("useShortcuts must be used inside <ShortcutsProvider>");
  }
  return ctx;
}

/** Any screen can opt into `/` by marking its search field. */
const SEARCH_SELECTOR =
  "[data-shortcut-search] input, input[data-shortcut-search]";

/**
 * Owns the app-wide keyboard layer and the guide it documents.
 *
 * Navigation honours permissions: a `g` jump the role can't follow is ignored
 * rather than bouncing them into a denial screen.
 */
export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { can, loading } = useSession();
  const [guideOpen, setGuideOpen] = useState(false);

  const onGoTo = useCallback(
    (key: string) => {
      const item = NAV_GROUPS.flatMap((group) => group.items).find(
        (candidate) => candidate.shortcut === key,
      );
      if (!item) return;
      // Only refuse when we positively know the role lacks access. While the
      // session is still resolving, let the jump through — `RequireScope` is
      // the authority, and swallowing the keypress would make shortcuts feel
      // broken for the first moments after load.
      if (!loading && item.scope && !can(item.scope)) return;
      router.push(item.href);
    },
    [router, can, loading],
  );

  const onFocusSearch = useCallback(() => {
    const field = document.querySelector<HTMLInputElement>(SEARCH_SELECTOR);
    if (!field) return;
    field.focus();
    field.select();
  }, []);

  useGlobalShortcuts({
    onGoTo,
    onShowGuide: () => setGuideOpen(true),
    onFocusSearch,
  });

  const value = useMemo<ShortcutsContextValue>(
    () => ({ openGuide: () => setGuideOpen(true) }),
    [],
  );

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
      {guideOpen ? (
        <ShortcutsDialog onClose={() => setGuideOpen(false)} />
      ) : null}
    </ShortcutsContext.Provider>
  );
}
