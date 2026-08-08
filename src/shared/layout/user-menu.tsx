"use client";

import { useRouter } from "next/navigation";
import {
  isSimulatedOffline,
  type Role,
  setSimulatedOffline,
} from "@/lib/backend";
import { cn } from "@/lib/utils";
import { useCommandPalette } from "@/shared/command";
import { useShortcuts } from "@/shared/keyboard";
import {
  AnomaliesIcon,
  ChevronUpDownIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UsersIcon,
} from "@/shared/icons";
import { useOnlineStatus } from "@/shared/hooks/use-online-status";
import { useSession } from "@/shared/session";
import { useTheme } from "@/shared/theme/theme-provider";
import {
  Avatar,
  Kbd,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Popover,
} from "@/shared/ui";

/**
 * Roles available to sign in as. Switching is a demo affordance: the whole UI
 * (navigation, actions, route access) re-derives from the permission matrix.
 */
const ROLES: readonly { value: Role; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "operator", label: "Operator" },
  { value: "developer", label: "Developer" },
  { value: "billing", label: "Billing" },
  { value: "viewer", label: "Viewer" },
];

export function UserMenu() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const palette = useCommandPalette();
  const { openGuide } = useShortcuts();
  const { session, switchRole, switching } = useSession();
  const online = useOnlineStatus();

  const name = session?.user.name ?? "…";
  const email = session?.user.email ?? "";
  const roleLabel = session
    ? `${session.team?.name ?? "Helix"} · ${ROLES.find((r) => r.value === session.role)?.label ?? session.role}`
    : "Loading…";

  return (
    <Popover
      side="top"
      align="start"
      label="Account menu"
      panelClassName="w-[calc(var(--spacing-sidebar)-20px)]"
      button={({ toggle, open }) => (
        <button
          type="button"
          aria-label="Account menu"
          aria-expanded={open}
          onClick={toggle}
          className="hover:bg-hover flex w-full cursor-pointer items-center gap-2.5 rounded-[8px] px-2 py-1.75 text-left"
        >
          <Avatar name={name} size={30} />
          <div className="min-w-0 flex-1">
            <div className="text-text truncate text-[12.5px] font-semibold">
              {name}
            </div>
            <div className="text-text-3 truncate text-[11px]">{roleLabel}</div>
          </div>
          <ChevronUpDownIcon size={15} className="text-text-3" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MenuLabel>Signed in as</MenuLabel>
          <div className="px-2 pb-1.5">
            <div className="text-text truncate text-[12.5px] font-semibold">
              {name}
            </div>
            <div className="text-text-3 truncate text-[11px]">{email}</div>
          </div>
          <MenuSeparator />
          <MenuLabel>View as role</MenuLabel>
          <div className="flex flex-wrap gap-1 px-2 pb-2">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                disabled={switching}
                aria-pressed={session?.role === role.value}
                onClick={() => switchRole(role.value)}
                className={cn(
                  "rounded-control cursor-pointer border px-2 py-1 text-[11px] font-medium transition-colors disabled:opacity-50",
                  session?.role === role.value
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-token text-text-2 hover:border-border-strong",
                )}
              >
                {role.label}
              </button>
            ))}
          </div>
          <MenuSeparator />
          <MenuItem
            icon={<UsersIcon size={15} className="text-text-3" />}
            href="/users"
            onClick={close}
          >
            Your profile
          </MenuItem>
          <MenuItem
            icon={<SearchIcon size={15} className="text-text-3" />}
            hint={<Kbd>⌘K</Kbd>}
            onClick={() => {
              close();
              palette.open();
            }}
          >
            Command palette
          </MenuItem>
          <MenuItem
            icon={<ChevronUpDownIcon size={15} className="text-text-3" />}
            hint={<Kbd>?</Kbd>}
            onClick={() => {
              close();
              openGuide();
            }}
          >
            Keyboard shortcuts
          </MenuItem>
          <MenuItem
            icon={
              theme === "dark" ? (
                <SunIcon size={15} className="text-text-3" />
              ) : (
                <MoonIcon size={15} className="text-text-3" />
              )
            }
            onClick={toggleTheme}
          >
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={<AnomaliesIcon size={15} className="text-text-3" />}
            onClick={() => setSimulatedOffline(!isSimulatedOffline())}
          >
            {online ? "Simulate offline" : "Restore connection"}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            tone="danger"
            onClick={() => {
              close();
              router.push("/");
            }}
          >
            Sign out
          </MenuItem>
        </>
      )}
    </Popover>
  );
}
