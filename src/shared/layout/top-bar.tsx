"use client";

import { useState } from "react";
import { ChevronDownIcon, SearchIcon } from "@/shared/icons";
import { useCommandPalette } from "@/shared/command";
import { Kbd } from "@/shared/ui/kbd";
import { StatusDot } from "@/shared/ui/status-dot";
import { ThemeToggle } from "@/shared/theme/theme-toggle";
import { Breadcrumbs } from "./breadcrumbs";
import { NotificationsMenu } from "./notifications-menu";

const ENVIRONMENTS = ["Production", "Staging", "Development"] as const;
type Env = (typeof ENVIRONMENTS)[number];

export function TopBar() {
  const [env, setEnv] = useState<Env>("Production");
  const palette = useCommandPalette();

  return (
    <header className="bg-surface h-topbar border-border-token flex flex-none items-center gap-3.5 border-b px-4.5">
      <Breadcrumbs />

      <button
        type="button"
        onClick={palette.open}
        aria-keyshortcuts="Meta+K Control+K"
        className="bg-surface-2 text-text-3 border-border-token hover:border-border-strong ml-3.5 flex h-8 min-w-57.5 cursor-pointer items-center gap-2 rounded-[8px] border pr-2.5 pl-2.5 font-sans text-[12.5px]"
      >
        <SearchIcon size={14} />
        <span className="flex-1 text-left">Search or jump to…</span>
        <Kbd>⌘K</Kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() =>
            setEnv(
              ENVIRONMENTS[
                (ENVIRONMENTS.indexOf(env) + 1) % ENVIRONMENTS.length
              ]!,
            )
          }
          className="bg-surface-2 text-text border-border-token hover:border-border-strong flex h-8 cursor-pointer items-center gap-1.75 rounded-[8px] border px-2.5 text-[12px] font-medium"
        >
          <StatusDot tone="success" />
          {env}
          <ChevronDownIcon size={13} className="text-text-3" />
        </button>

        <NotificationsMenu />

        <ThemeToggle />
      </div>
    </header>
  );
}
