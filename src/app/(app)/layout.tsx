import type { ReactNode } from "react";
import { ProvisioningProvider } from "@/features/provisioning";
import { AppShell } from "@/shared/layout/app-shell";

/**
 * Layout for the authenticated application shell.
 * Routes inside `(app)` share the sidebar + top bar, and the provisioning
 * wizard controller so any screen (or the command palette) can launch it.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return (
    <ProvisioningProvider>
      <AppShell>{children}</AppShell>
    </ProvisioningProvider>
  );
}
