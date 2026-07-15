"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelixLogoIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavItem } from "@/shared/nav/nav-config";
import { Avatar } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { ChevronUpDownIcon } from "@/shared/icons";

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  const prefixes = item.activeWhen ?? [item.href];
  return prefixes.some((p) => pathname.startsWith(`${p}/`));
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-sidebar flex h-full w-[var(--spacing-sidebar)] flex-none flex-col border-r border-[var(--color-border)]">
      <div className="flex h-[var(--spacing-topbar)] flex-none items-center gap-2.5 border-b border-[var(--color-border)] px-4">
        <div
          className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[7px] text-white"
          style={{
            background:
              "linear-gradient(135deg,var(--color-brand),var(--color-brand-2))",
            boxShadow: "0 2px 8px -2px var(--color-brand)",
          }}
        >
          <HelixLogoIcon size={15} strokeWidth={2.4} />
        </div>
        <div className="text-text text-[15px] font-bold tracking-tight">
          Helix
        </div>
        <div className="text-text-3 ml-auto rounded-[5px] border border-[var(--color-border)] px-1.5 py-[2px] font-mono text-[9.5px] font-semibold">
          v4.2
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2.5 pt-2.5 pb-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <div className="text-text-3 px-2 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider uppercase">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-[7px] text-[13px] no-underline transition-colors",
                    active
                      ? "text-text bg-brand-soft font-semibold shadow-[inset_2px_0_0_var(--color-brand)]"
                      : "text-text-2 hover:bg-hover font-medium",
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "flex-none",
                      active ? "text-brand" : "text-text-3",
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge ? (
                    <Badge
                      tone={item.badgeKind === "danger" ? "danger" : "neutral"}
                      mono
                    >
                      {item.badge}
                    </Badge>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex-none border-t border-[var(--color-border)] p-2.5">
        <button
          type="button"
          className="hover:bg-hover flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-[7px] text-left"
        >
          <Avatar name="Dana Krishnan" size={30} />
          <div className="min-w-0 flex-1">
            <div className="text-text truncate text-[12.5px] font-semibold">
              Dana Krishnan
            </div>
            <div className="text-text-3 truncate text-[11px]">
              Platform Ops · Admin
            </div>
          </div>
          <ChevronUpDownIcon size={15} className="text-text-3" />
        </button>
      </div>
    </aside>
  );
}
