"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observe an element's content-box width so SVG charts can render at a crisp,
 * measured pixel size (no viewBox distortion of strokes or text) and reflow
 * responsively. Returns a ref to attach and the current width (0 until first
 * measurement — callers should render a spacer/skeleton while width is 0).
 */
export function useMeasure<T extends HTMLElement = HTMLDivElement>(): [
  React.RefObject<T | null>,
  number,
] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(el);
    setWidth(Math.round(el.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}
