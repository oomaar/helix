"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PROVISION_EVENT } from "@/shared/lib/app-events";
import dynamic from "next/dynamic";

// Deferred: the wizard and its four steps only load once launched.
const ProvisionWizard = dynamic(
  () => import("./provision-wizard").then((m) => m.ProvisionWizard),
  { ssr: false },
);

type ProvisioningContextValue = { open: () => void; close: () => void };

const ProvisioningContext = createContext<ProvisioningContextValue | null>(
  null,
);

export function useProvisioning(): ProvisioningContextValue {
  const ctx = useContext(ProvisioningContext);
  if (!ctx) {
    throw new Error(
      "useProvisioning must be used inside <ProvisioningProvider>",
    );
  }
  return ctx;
}

/**
 * Owns the provisioning wizard's open state. Can be opened via the context
 * (`useProvisioning`) or the decoupled `PROVISION_EVENT` (used by the command
 * palette). The wizard is mounted only while open, so each launch starts fresh.
 */
export function ProvisioningProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(PROVISION_EVENT, onOpen);
    return () => window.removeEventListener(PROVISION_EVENT, onOpen);
  }, []);

  const value = useMemo<ProvisioningContextValue>(
    () => ({ open: () => setOpen(true), close: () => setOpen(false) }),
    [],
  );

  return (
    <ProvisioningContext.Provider value={value}>
      {children}
      {open ? <ProvisionWizard onClose={() => setOpen(false)} /> : null}
    </ProvisioningContext.Provider>
  );
}
