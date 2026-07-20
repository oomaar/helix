import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";

/**
 * Two-column shell (sidebar + topbar + scrollable main).
 * Used by every authenticated route.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="bg-bg text-text flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex h-full min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
