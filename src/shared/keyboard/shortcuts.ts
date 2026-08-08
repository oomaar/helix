/**
 * The application's keyboard contract, declared once.
 *
 * The guide dialog renders straight from these definitions, so a shortcut can
 * never be implemented but undocumented (or documented but gone).
 */

/** Key prefix that starts a "jump to screen" sequence. */
export const GO_TO_PREFIX = "g";

export type ShortcutKeys = readonly string[];

export type ShortcutDef = {
  id: string;
  /** Rendered as separate keys; `+` inside an entry means "held together". */
  keys: ShortcutKeys;
  label: string;
};

export type ShortcutGroup = {
  title: string;
  hint?: string;
  shortcuts: readonly ShortcutDef[];
};

/** Platform-appropriate modifier glyph, resolved on the client. */
export function modifierKey(): string {
  if (typeof navigator === "undefined") return "Ctrl";
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent)
    ? "⌘"
    : "Ctrl";
}

export const GENERAL_SHORTCUTS: readonly ShortcutDef[] = [
  { id: "palette", keys: ["MOD", "K"], label: "Open the command palette" },
  { id: "guide", keys: ["?"], label: "Show keyboard shortcuts" },
  { id: "search", keys: ["/"], label: "Focus search on this screen" },
  { id: "dismiss", keys: ["Esc"], label: "Close a dialog, drawer or menu" },
];

export const NAVIGATION_HINT = `Press ${GO_TO_PREFIX.toUpperCase()} then a key`;
