"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PermissionScope } from "@/lib/backend";
import {
  AlertRulesIcon,
  BudgetsIcon,
  DashboardIcon,
  DownloadIcon,
  type IconComponent,
  PlusIcon,
  PoliciesIcon,
  SearchIcon,
} from "@/shared/icons";
import { cn } from "@/lib/utils";
import {
  type CreateTarget,
  emitOpenProvisioning,
  requestCreate,
} from "@/shared/lib/app-events";
import { useShortcuts } from "@/shared/keyboard";
import { NAV_GROUPS } from "@/shared/nav/nav-config";
import { useSession } from "@/shared/session";
import { useTheme } from "@/shared/theme/theme-provider";
import { Dialog, EmptyState, Kbd } from "@/shared/ui";

type Command = {
  id: string;
  label: string;
  group: string;
  icon: IconComponent;
  keywords?: string;
  hint?: string;
  perform: () => void;
};

/** Actions that write, and the scope a role needs `edit` on to see them. */
const WRITE_SCOPES: Readonly<Record<string, PermissionScope>> = {
  "action:provision": "resources",
  "action:new-budget": "budgets",
  "action:new-policy": "policies",
  "action:new-alert-rule": "alerts",
};

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { can } = useSession();
  const { openGuide } = useShortcuts();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    /**
     * Navigate to the screen that owns a create form and ask it to open —
     * "Create a policy" should land on the builder, not just the list.
     */
    const create = (href: string, target: CreateTarget) => () => {
      router.push(href);
      onClose();
      requestCreate(target);
    };
    const nav: Command[] = NAV_GROUPS.flatMap((group) =>
      // Don't offer a jump the role can't follow.
      group.items
        .filter((item) => !item.scope || can(item.scope))
        .map((item) => ({
          id: `nav:${item.id}`,
          label: item.label,
          group: "Navigate",
          icon: item.icon,
          keywords: `${group.label} ${item.href}`,
          perform: go(item.href),
        })),
    );
    const writable: Command[] = [
      {
        id: "action:provision",
        label: "Provision resource",
        group: "Actions",
        icon: PlusIcon,
        keywords: "new create resource",
        perform: () => {
          onClose();
          emitOpenProvisioning();
        },
      },
      {
        id: "action:new-budget",
        label: "Create a budget",
        group: "Actions",
        icon: BudgetsIcon,
        keywords: "new budget limit allocation finops",
        perform: create("/budgets", "budget"),
      },
      {
        id: "action:new-policy",
        label: "Create a governance policy",
        group: "Actions",
        icon: PoliciesIcon,
        keywords: "new policy guardrail enforcement compliance rule",
        perform: create("/policies", "policy"),
      },
      {
        id: "action:new-alert-rule",
        label: "Create an alert rule",
        group: "Actions",
        icon: AlertRulesIcon,
        keywords: "new alert rule threshold notification paging oncall",
        perform: create("/alerts", "alert-rule"),
      },
    ].filter(
      (c) =>
        WRITE_SCOPES[c.id] === undefined || can(WRITE_SCOPES[c.id]!, "edit"),
    );

    const actions: Command[] = [
      ...writable,
      {
        id: "action:export",
        label: "Export dashboard report",
        group: "Actions",
        icon: DownloadIcon,
        keywords: "download csv report",
        perform: go("/dashboard"),
      },
      {
        id: "action:shortcuts",
        label: "Keyboard shortcuts",
        group: "Actions",
        icon: SearchIcon,
        keywords: "keyboard shortcuts keys help hotkeys",
        hint: "?",
        perform: () => {
          onClose();
          openGuide();
        },
      },
      {
        id: "action:theme",
        label:
          theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        group: "Actions",
        icon: DashboardIcon,
        keywords: "theme dark light mode appearance",
        perform: () => {
          toggleTheme();
          onClose();
        },
      },
    ];
    return [...nav, ...actions];
  }, [router, theme, toggleTheme, onClose, can, openGuide]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [commands, query]);

  // Keep the highlighted row scrolled into view (DOM sync, not state).
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[active]?.perform();
    }
  };

  // Group results while tracking a running flat index for keyboard selection.
  let flatIndex = -1;
  const groups = [...new Set(results.map((r) => r.group))];

  return (
    <Dialog open onClose={onClose} labelledBy="command-palette-input">
      <div className="border-border-token flex items-center gap-2.5 border-b px-3.5">
        <SearchIcon size={16} className="text-text-3 flex-none" />
        <input
          id="command-palette-input"
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search or jump to…"
          className="text-text placeholder:text-text-3 h-12 w-full bg-transparent text-[14px] outline-none"
          role="combobox"
          aria-expanded
          aria-controls="command-palette-list"
          aria-activedescendant={`command-${active}`}
        />
        <Kbd className="flex-none">Esc</Kbd>
      </div>

      <div
        ref={listRef}
        id="command-palette-list"
        role="listbox"
        className="max-h-[52vh] overflow-y-auto p-1.5"
      >
        {results.length === 0 ? (
          <EmptyState
            title="No matches"
            description={`Nothing matches “${query}”.`}
            className="py-10"
          />
        ) : (
          groups.map((group) => (
            <div key={group} className="mb-1">
              <div className="text-text-3 px-2 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase">
                {group}
              </div>
              {results
                .filter((r) => r.group === group)
                .map((cmd) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const isActive = index === active;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      id={`command-${index}`}
                      data-index={index}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseMove={() => setActive(index)}
                      onClick={() => cmd.perform()}
                      className={cn(
                        "rounded-control flex w-full cursor-pointer items-center gap-2.5 px-2 py-2 text-left text-[13px] transition-colors",
                        isActive ? "bg-brand-soft text-text" : "text-text-2",
                      )}
                    >
                      <Icon
                        size={15}
                        className={cn(
                          "flex-none",
                          isActive ? "text-brand" : "text-text-3",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {cmd.label}
                      </span>
                      {isActive ? <Kbd className="flex-none">↵</Kbd> : null}
                    </button>
                  );
                })}
            </div>
          ))
        )}
      </div>

      <div className="border-border-token text-text-3 flex items-center gap-3 border-t px-3.5 py-2 text-[10.5px]">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          to navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd>
          to select
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Esc</Kbd>
          to close
        </span>
      </div>
    </Dialog>
  );
}
