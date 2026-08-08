"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export type ContextMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: "default" | "danger";
  disabled?: boolean;
  /** Draws a divider above this item. */
  separatorBefore?: boolean;
  onSelect: () => void;
};

/** Where a context menu was summoned, in viewport coordinates. */
export type ContextMenuAnchor = { x: number; y: number };

type ContextMenuProps = {
  anchor: ContextMenuAnchor;
  items: readonly ContextMenuItem[];
  onClose: () => void;
  label: string;
};

const MENU_WIDTH = 208;
const EDGE_GAP = 8;
const ESTIMATED_ROW = 30;

/**
 * Right-click menu rendered at the pointer.
 *
 * Distinct from `Popover`, which hangs off a trigger element: this one is
 * summoned at arbitrary coordinates, so it positions itself in a portal with
 * fixed coordinates and flips when it would overflow the viewport.
 *
 * Keyboard operable throughout — arrows roam, Home/End jump, Enter activates,
 * Escape dismisses — because a context menu that only opens on right-click
 * would otherwise be unreachable without a mouse.
 */
export function ContextMenu({
  anchor,
  items,
  onClose,
  label,
}: ContextMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const enabled = items.filter((item) => !item.disabled);
  const [active, setActive] = useState(0);

  // Flip toward whichever side has room, so the menu never opens off-screen.
  const estimatedHeight = items.length * ESTIMATED_ROW + 12;
  const flipX =
    typeof window !== "undefined" &&
    anchor.x + MENU_WIDTH + EDGE_GAP > window.innerWidth;
  const flipY =
    typeof window !== "undefined" &&
    anchor.y + estimatedHeight + EDGE_GAP > window.innerHeight;

  const close = useCallback(() => {
    restoreRef.current?.focus?.();
    onClose();
  }, [onClose]);

  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    };
    // A second right-click elsewhere should move the menu, not stack another.
    const onScroll = () => onClose();
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("contextmenu", onPointerDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("contextmenu", onPointerDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [onClose]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => Math.min(enabled.length - 1, i + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      setActive(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActive(enabled.length - 1);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const item = enabled[active];
      if (item) {
        close();
        item.onSelect();
      }
    } else if (event.key === "Tab") {
      close();
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={panelRef}
      role="menu"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{
        position: "fixed",
        left: flipX ? undefined : anchor.x,
        right: flipX ? window.innerWidth - anchor.x : undefined,
        top: flipY ? undefined : anchor.y,
        bottom: flipY ? window.innerHeight - anchor.y : undefined,
        width: MENU_WIDTH,
      }}
      className="border-border-strong bg-raised animate-pop-in z-100 rounded-[10px] border p-1 shadow-(--shadow-elev-2) outline-none"
    >
      {items.map((item) => {
        const index = enabled.indexOf(item);
        const isActive = index === active && index !== -1;
        return (
          <div key={item.id}>
            {item.separatorBefore ? (
              <div className="bg-border-token my-1 h-px" role="separator" />
            ) : null}
            <button
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onMouseEnter={() => index !== -1 && setActive(index)}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={cn(
                "rounded-control flex w-full items-center gap-2.5 px-2 py-1.5 text-left text-[12.5px] transition-colors",
                item.disabled
                  ? "text-text-3 cursor-not-allowed"
                  : "cursor-pointer",
                !item.disabled && item.tone === "danger"
                  ? "text-danger hover:bg-danger-soft"
                  : !item.disabled
                    ? "text-text-2 hover:bg-hover hover:text-text"
                    : "",
                isActive && !item.disabled
                  ? item.tone === "danger"
                    ? "bg-danger-soft"
                    : "bg-hover text-text"
                  : "",
              )}
            >
              {item.icon ? (
                <span className="text-text-3 flex-none">{item.icon}</span>
              ) : null}
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.hint ? (
                <span className="text-text-3 flex-none font-mono text-[10.5px]">
                  {item.hint}
                </span>
              ) : null}
            </button>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
