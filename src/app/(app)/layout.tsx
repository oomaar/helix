import type { ReactNode } from "react";
import { AppShell } from "@/shared/layout/app-shell";

/**
 * Layout for the authenticated application shell.
 * Routes inside `(app)` share the sidebar + top bar.
 */
export default function AppGroupLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
