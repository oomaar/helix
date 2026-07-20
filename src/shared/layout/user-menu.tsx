"use client";

import { useRouter } from "next/navigation";
import { useCommandPalette } from "@/shared/command";
import {
  ChevronUpDownIcon,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UsersIcon,
} from "@/shared/icons";
import { useTheme } from "@/shared/theme/theme-provider";
import {
  Avatar,
  Kbd,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Popover,
} from "@/shared/ui";

const USER = {
  name: "Dana Krishnan",
  email: "dana.krishnan@helix.io",
  role: "Platform Ops · Admin",
};

export function UserMenu() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const palette = useCommandPalette();

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
          <Avatar name={USER.name} size={30} />
          <div className="min-w-0 flex-1">
            <div className="text-text truncate text-[12.5px] font-semibold">
              {USER.name}
            </div>
            <div className="text-text-3 truncate text-[11px]">{USER.role}</div>
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
              {USER.name}
            </div>
            <div className="text-text-3 truncate text-[11px]">{USER.email}</div>
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
