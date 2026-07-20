"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon, HelixLogoIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavItem } from "@/shared/nav/nav-config";
import { Badge } from "@/shared/ui/badge";
import { IconButton } from "@/shared/ui/icon-button";
import { useSidebar } from "./sidebar-context";
import { UserMenu } from "./user-menu";

function isActive(item: NavItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  const prefixes = item.activeWhen ?? [item.href];
  return prefixes.some((p) => pathname.startsWith(`${p}/`));
}

/** Inner sidebar content, shared by the desktop rail and the mobile drawer. */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="h-topbar border-border-token flex flex-none items-center gap-2.5 border-b px-4">
        <div
          className="rounded-control flex h-6.5 w-6.5 flex-none items-center justify-center text-white"
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
        <div className="text-text-3 border-border-token ml-auto rounded-[5px] border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold">
          v4.2
        </div>
        {onClose ? (
          <IconButton
            aria-label="Close navigation"
            onClick={onClose}
            className="lg:hidden"
          >
            <CloseIcon size={16} />
          </IconButton>
        ) : null}
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
                  onClick={() => onClose?.()}
                  className={cn(
                    "mb-0.5 flex cursor-pointer items-center gap-2.5 rounded-[8px] px-2.5 py-1.75 text-[13px] no-underline transition-colors",
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

      <div className="border-border-token flex-none border-t p-2.5">
        <UserMenu />
      </div>
    </>
  );
}

/** Static navigation rail — visible from the `lg` breakpoint up. */
export function Sidebar() {
  return (
    <aside
      data-print-hide
      className="bg-sidebar w-sidebar border-border-token hidden h-full flex-none flex-col border-r lg:flex"
    >
      <SidebarContent />
    </aside>
  );
}

/** Off-canvas navigation drawer — used below the `lg` breakpoint. */
export function SidebarDrawer() {
  const { open, close } = useSidebar();

  return (
    <div
      data-print-hide
      className={cn(
        "fixed inset-0 z-40 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      {/* backdrop */}
      <button
        type="button"
        aria-label="Close navigation"
        tabIndex={open ? 0 : -1}
        onClick={close}
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      {/* panel */}
      <aside
        className={cn(
          "bg-sidebar w-sidebar border-border-token absolute inset-y-0 left-0 flex h-full flex-col border-r shadow-(--shadow-elev-2) transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <SidebarContent onClose={close} />
      </aside>
    </div>
  );
}
