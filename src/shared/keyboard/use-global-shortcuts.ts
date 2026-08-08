"use client";

import { useEffect, useRef } from "react";

/** How long a `g` prefix stays armed before it lapses. */
const SEQUENCE_TIMEOUT_MS = 1200;

type Handlers = {
  /** Second key of a `g …` sequence. */
  onGoTo: (key: string) => void;
  onShowGuide: () => void;
  onFocusSearch: () => void;
};

/**
 * True when the event came from somewhere the user is typing.
 *
 * Without this, `g` would hijack the resources search box and `?` would never
 * reach a textarea — shortcuts have to yield to text entry.
 */
function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  // Custom listbox/combobox triggers swallow their own typing.
  const role = target.getAttribute("role");
  return role === "combobox" || role === "listbox" || role === "textbox";
}

/**
 * True while a modal surface actually owns the screen.
 *
 * Presence of `role="dialog"` is not enough: the mobile navigation drawer stays
 * mounted and is hidden with `aria-hidden` when closed, so a naive query would
 * report an overlay on every screen and silently kill these shortcuts.
 */
function isOverlayOpen(): boolean {
  const overlays = document.querySelectorAll<HTMLElement>(
    '[role="dialog"], [role="alertdialog"]',
  );
  for (const overlay of overlays) {
    if (!overlay.closest('[aria-hidden="true"]')) return true;
  }
  return false;
}

/**
 * App-wide keyboard layer: `g` then a key to jump between screens, `?` for the
 * guide, `/` to focus the current screen's search.
 *
 * Deliberately does not handle ⌘K (the command palette owns it) or Escape
 * (each overlay owns its own dismissal), so there is exactly one handler per
 * behaviour.
 */
export function useGlobalShortcuts({
  onGoTo,
  onShowGuide,
  onFocusSearch,
}: Handlers): void {
  const handlers = useRef({ onGoTo, onShowGuide, onFocusSearch });
  useEffect(() => {
    handlers.current = { onGoTo, onShowGuide, onFocusSearch };
  });

  useEffect(() => {
    let armed = false;
    let armedTimer: ReturnType<typeof setTimeout> | undefined;

    const disarm = () => {
      armed = false;
      if (armedTimer) clearTimeout(armedTimer);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Never steal a modifier chord — those belong to the browser or ⌘K.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key;

      if (armed) {
        disarm();
        if (/^[a-z]$/i.test(key)) {
          event.preventDefault();
          handlers.current.onGoTo(key.toLowerCase());
        }
        return;
      }

      // The guide is reachable even from a dialog; navigation is not.
      if (key === "?") {
        event.preventDefault();
        handlers.current.onShowGuide();
        return;
      }

      if (isOverlayOpen()) return;

      if (key === "/") {
        event.preventDefault();
        handlers.current.onFocusSearch();
        return;
      }

      if (key.toLowerCase() === "g") {
        armed = true;
        armedTimer = setTimeout(disarm, SEQUENCE_TIMEOUT_MS);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      disarm();
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
