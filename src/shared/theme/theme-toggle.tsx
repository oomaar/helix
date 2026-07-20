"use client";

import { MoonIcon, SunIcon } from "@/shared/icons";
import { IconButton } from "@/shared/ui/icon-button";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
    </IconButton>
  );
}
