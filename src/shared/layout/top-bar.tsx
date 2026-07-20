"use client";

import { MenuIcon, SearchIcon } from "@/shared/icons";
import { useCommandPalette } from "@/shared/command";
import { IconButton } from "@/shared/ui/icon-button";
import { Kbd } from "@/shared/ui/kbd";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { EnvSwitcher } from "./env-switcher";
import { NotificationsMenu } from "./notifications-menu";
import { useSidebar } from "./sidebar-context";

export function TopBar() {
  const palette = useCommandPalette();
  const sidebar = useSidebar();

  return (
    <header
      data-print-hide
      className="bg-surface h-topbar border-border-token flex flex-none items-center gap-2 border-b px-3 md:gap-3.5 md:px-4.5"
    >
      <IconButton
        aria-label="Open navigation"
        onClick={sidebar.toggle}
        className="lg:hidden"
      >
        <MenuIcon size={18} />
      </IconButton>

      <Breadcrumbs />

      <button
        type="button"
        onClick={palette.open}
        aria-keyshortcuts="Meta+K Control+K"
        className="bg-surface-2 text-text-3 border-border-token hover:border-border-strong ml-3.5 hidden h-8 min-w-57.5 cursor-pointer items-center gap-2 rounded-[8px] border pr-2.5 pl-2.5 font-sans text-[12.5px] md:flex"
      >
        <SearchIcon size={14} />
        <span className="flex-1 text-left">Search or jump to…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <IconButton
          aria-label="Search"
          onClick={palette.open}
          className="md:hidden"
        >
          <SearchIcon size={16} />
        </IconButton>

        <EnvSwitcher />

        <NotificationsMenu />

        <ThemeToggle />
      </div>
    </header>
  );
}
