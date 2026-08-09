import type { ReactNode } from "react";
import { CommandPaletteProvider } from "@/shared/command";
import { ShortcutsProvider } from "@/shared/keyboard";
import { OfflineBanner } from "./offline-banner";
import { Sidebar, SidebarDrawer } from "./sidebar";
import { SidebarProvider } from "./sidebar-context";
import { TopBar } from "./top-bar";

/**
 * Two-column shell (sidebar + topbar + scrollable main).
 * Used by every authenticated route. The shortcuts provider owns the app-wide
 * keyboard layer (`g` navigation, `?`, `/`) plus the guide that documents it;
 * the command palette provider wraps the shell so both the header search field
 * and the ⌘K shortcut can summon it.
 *
 * Shortcuts must be the outer provider: `CommandPaletteProvider` renders the
 * palette as a *sibling* of its children, so nesting it inside would leave the
 * palette outside the shortcuts context it reads from.
 *
 * Responsive: the sidebar is a static rail from `lg` up and an off-canvas
 * drawer below it (toggled from the top bar). `h-dvh` tracks the mobile
 * dynamic viewport so the shell fills the screen without browser-chrome jump.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ShortcutsProvider>
      <CommandPaletteProvider>
        <SidebarProvider>
          <div
            data-shell-root
            className="bg-bg text-text flex h-dvh w-full overflow-hidden"
          >
            <Sidebar />
            <SidebarDrawer />
            <div className="flex h-full min-w-0 flex-1 flex-col">
              {/*
               * First tab stop on every screen: without it a keyboard user
               * traverses the whole sidebar before reaching the page. Visually
               * hidden until focused.
               */}
              <a
                href="#main-content"
                className="bg-brand focus-visible:ring-brand-line sr-only rounded-b-[8px] px-3 py-2 text-[12.5px] font-medium text-white focus-visible:not-sr-only focus-visible:absolute focus-visible:top-2 focus-visible:left-2 focus-visible:z-100 focus-visible:ring-2"
              >
                Skip to content
              </a>
              <TopBar />
              <OfflineBanner />
              <main
                id="main-content"
                tabIndex={-1}
                data-shell-main
                className="min-h-0 flex-1 overflow-y-auto outline-none"
              >
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </CommandPaletteProvider>
    </ShortcutsProvider>
  );
}
