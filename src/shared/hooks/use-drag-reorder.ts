"use client";

import { useCallback, useState } from "react";

/** Moves one item and returns a new array; out-of-range moves are no-ops. */
export function moveItem<T>(
  items: readonly T[],
  from: number,
  to: number,
): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) {
    return next;
  }
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

type Options = {
  count: number;
  onReorder: (from: number, to: number) => void;
  /** Names the moved thing in the live-region announcement. */
  describe?: (index: number) => string;
};

export type DragReorder = {
  draggingIndex: number | null;
  overIndex: number | null;
  /** Spread onto each reorderable row. */
  getRowProps: (index: number) => {
    draggable: boolean;
    onDragStart: (event: React.DragEvent) => void;
    onDragEnter: (event: React.DragEvent) => void;
    onDragOver: (event: React.DragEvent) => void;
    onDrop: (event: React.DragEvent) => void;
    onDragEnd: () => void;
  };
  /** Spread onto the row's grip. Provides the keyboard route. */
  getHandleProps: (index: number) => {
    "aria-label": string;
    "aria-keyshortcuts": string;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
  /** Render inside an `aria-live` region. */
  announcement: string;
};

/**
 * Reordering by pointer *and* keyboard.
 *
 * HTML5 drag-and-drop is mouse-only — a list that can only be reordered by
 * dragging is unusable without one. The grip therefore doubles as a keyboard
 * control (arrow keys move the row), and every move is announced through a live
 * region so the new position is perceivable without sight of the list.
 */
export function useDragReorder({
  count,
  onReorder,
  describe,
}: Options): DragReorder {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const announce = useCallback(
    (from: number, to: number) => {
      const what = describe?.(from) ?? `Item ${from + 1}`;
      setAnnouncement(`${what} moved to position ${to + 1} of ${count}.`);
    },
    [count, describe],
  );

  const commit = useCallback(
    (from: number, to: number) => {
      if (from === to || to < 0 || to >= count) return;
      announce(from, to);
      onReorder(from, to);
    },
    [announce, count, onReorder],
  );

  const getRowProps = useCallback(
    (index: number) => ({
      draggable: true,
      onDragStart: (event: React.DragEvent) => {
        setDraggingIndex(index);
        event.dataTransfer.effectAllowed = "move";
        // Firefox refuses to start a drag without payload.
        event.dataTransfer.setData("text/plain", String(index));
      },
      onDragEnter: (event: React.DragEvent) => {
        event.preventDefault();
        setOverIndex(index);
      },
      onDragOver: (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        const from =
          draggingIndex ?? Number(event.dataTransfer.getData("text/plain"));
        if (Number.isFinite(from)) commit(from, index);
        setDraggingIndex(null);
        setOverIndex(null);
      },
      onDragEnd: () => {
        setDraggingIndex(null);
        setOverIndex(null);
      },
    }),
    [commit, draggingIndex],
  );

  const getHandleProps = useCallback(
    (index: number) => ({
      "aria-label": `Reorder ${describe?.(index) ?? `item ${index + 1}`}. Use arrow keys to move.`,
      "aria-keyshortcuts": "ArrowUp ArrowDown",
      onKeyDown: (event: React.KeyboardEvent) => {
        const delta =
          event.key === "ArrowUp" || event.key === "ArrowLeft"
            ? -1
            : event.key === "ArrowDown" || event.key === "ArrowRight"
              ? 1
              : 0;
        if (delta === 0) return;
        event.preventDefault();
        commit(index, index + delta);
      },
    }),
    [commit, describe],
  );

  return {
    draggingIndex,
    overIndex,
    getRowProps,
    getHandleProps,
    announcement,
  };
}
