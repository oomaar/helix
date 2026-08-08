"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSession,
  type PermissionAction,
  type PermissionScope,
  type Role,
  satisfies,
  type Session,
  setSessionRole,
} from "@/lib/backend";

type SessionContextValue = {
  session: Session | null;
  loading: boolean;
  /** Does the signed-in role hold at least `action` on `scope`? */
  can: (scope: PermissionScope, action?: PermissionAction) => boolean;
  switchRole: (role: Role) => void;
  switching: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

/** Shorthand for the common `can(scope, action)` check. */
export function useCan(
  scope: PermissionScope,
  action: PermissionAction = "view",
): boolean {
  return useSession().can(scope, action);
}

/**
 * Holds the signed-in identity and its resolved permission grants.
 *
 * Every screen reads authority from here rather than assuming it, so the
 * permission matrix in Administration actually governs the UI: change a grant
 * (or switch role) and navigation, actions and route access follow.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    let active = true;
    getSession()
      .then((next) => {
        if (active) setSession(next);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const switchRole = useCallback((role: Role) => {
    setSwitching(true);
    void setSessionRole(role)
      .then(setSession)
      .finally(() => setSwitching(false));
  }, []);

  const can = useCallback(
    (scope: PermissionScope, action: PermissionAction = "view") =>
      // Before the session resolves, assume no authority: it is safer for the
      // UI to reveal an action late than to offer one that will be rejected.
      satisfies(session?.grants[scope], action),
    [session],
  );

  const value = useMemo<SessionContextValue>(
    () => ({ session, loading, can, switchRole, switching }),
    [session, loading, can, switchRole, switching],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
