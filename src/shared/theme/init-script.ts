import { THEME_STORAGE_KEY } from "./types";

/**
 * Runs before hydration to set `data-theme` on <html>, avoiding a flash of
 * light content when the user prefers dark. Stringified into a <script> tag
 * in the root layout.
 */
export const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme =
      stored === "light" || stored === "dark"
        ? stored
        : prefersDark
          ? "dark"
          : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {
    document.documentElement.setAttribute("data-theme", "light");
  }
})();
`.trim();
