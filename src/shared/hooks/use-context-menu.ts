"use client";

import { useCallback, useState } from "react";
import type { ContextMenuAnchor } from "@/shared/ui";

type Opened<T> = { anchor: ContextMenuAnchor; target: T };

export type ContextMenuState<T> = {
  /** Open menu, or null. */
  opened: Opened<T> | null;
  close: () => void;
  /**
   * Handler for a row/card's `onContextMenu`. Also serves keyboard summoning:
   * Shift+F10 and the Menu key both fire `contextmenu`, where the browser
   * reports coordinates of 0 or -1 — those are re-anchored to the element.
   */
  onContextMenu: (event: React.MouseEvent, target: T) => void;
};

/**
 * Open/anchor state for a right-click menu, held once per list rather than per
 * row: a table with 25 rows needs one menu, not 25 mounted instances.
 */
export function useContextMenu<T>(): ContextMenuState<T> {
  const [opened, setOpened] = useState<Opened<T> | null>(null);

  const onContextMenu = useCallback((event: React.MouseEvent, target: T) => {
    event.preventDefault();
    event.stopPropagation();

    // Keyboard invocation reports no usable pointer position; anchor to the
    // element instead so the menu appears where the focus already is.
    const keyboardInvoked = event.clientX <= 0 && event.clientY <= 0;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();

    setOpened({
      target,
      anchor: keyboardInvoked
        ? { x: rect.left + 12, y: rect.bottom - 4 }
        : { x: event.clientX, y: event.clientY },
    });
  }, []);

  return {
    opened,
    close: useCallback(() => setOpened(null), []),
    onContextMenu,
  };
}
