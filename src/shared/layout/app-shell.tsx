import type { ReactNode } from "react";
import { CommandPaletteProvider } from "@/shared/command";
import { OfflineBanner } from "./offline-banner";
import { Sidebar, SidebarDrawer } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { TopBar } from "./top-bar";

/**
 * Two-column shell (sidebar + topbar + scrollable main).
 * Used by every authenticated route. The command palette provider wraps the
 * shell so both the header search field and the ⌘K shortcut can summon it.
 *
 * Responsive: the sidebar is a static rail from `lg` up and an off-canvas
 * drawer below it (toggled from the top bar). `h-dvh` tracks the mobile
 * dynamic viewport so the shell fills the screen without browser-chrome jump.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <CommandPaletteProvider>
      <SidebarProvider>
        <div
          data-shell-root
          className="bg-bg text-text flex h-dvh w-full overflow-hidden"
        >
          <Sidebar />
          <SidebarDrawer />
          <div className="flex h-full min-w-0 flex-1 flex-col">
            <TopBar />
            <OfflineBanner />
            <main data-shell-main className="min-h-0 flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </CommandPaletteProvider>
  );
}
