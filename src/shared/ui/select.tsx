"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";
import { useFieldControl, useFieldInvalid } from "./field";

export type SelectOption = { value: string; label: string };

type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
};

type Position = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placeAbove: boolean;
};

const PANEL_MAX = 260;
const GAP = 4;

/**
 * Custom single-select dropdown (listbox). Fully styled + theme-aware (unlike a
 * native `<select>`), keyboard operable (arrows / Enter / Escape, focus stays
 * on the trigger via `aria-activedescendant`), and rendered in a portal with
 * fixed positioning so it never clips inside scrollable containers or modals.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  invalid,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const control = useFieldControl(id);
  const fieldInvalid = useFieldInvalid();
  const listId = control.id ?? generatedId;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const [active, setActive] = useState(0);

  const selected = options.find((o) => o.value === value) ?? null;

  const computePosition = useCallback((): Position | null => {
    const el = triggerRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - GAP;
    const above = r.top - GAP;
    const placeAbove = below < Math.min(PANEL_MAX, 160) && above > below;
    return {
      left: r.left,
      width: r.width,
      top: placeAbove ? r.top - GAP : r.bottom + GAP,
      maxHeight: Math.min(PANEL_MAX, placeAbove ? above : below),
      placeAbove,
    };
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const next = computePosition();
    if (!next) return;
    setPos(next);
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  }, [computePosition, disabled, options, value]);

  const select = useCallback(
    (option: SelectOption) => {
      onChange(option.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange],
  );

  // Reposition while open (ancestor scroll uses capture); close on outside click.
  useEffect(() => {
    if (!open) return;
    const reposition = () => {
      const next = computePosition();
      if (next) setPos(next);
    };
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !panelRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, computePosition]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open) return;
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const option = options[active];
      if (option) select(option);
    } else if (e.key === "Escape") {
      // Close only the dropdown — don't let it bubble to a parent Dialog.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={listId}
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-controls={`${listId}-listbox`}
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-invalid={invalid || fieldInvalid ? true : undefined}
        aria-describedby={control["aria-describedby"]}
        aria-activedescendant={open ? `${listId}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "bg-surface border-border-token flex h-8 w-full items-center gap-2 rounded-[8px] border pr-2 pl-2.5 text-left font-sans text-[12.5px] transition-colors",
          "focus-visible:border-brand-line focus-visible:ring-brand-soft cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
          open && "border-brand-line ring-brand-soft ring-2",
          (invalid || fieldInvalid) && "border-danger",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            selected ? "text-text" : "text-text-3",
          )}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon size={14} className="text-text-3 flex-none" />
      </button>

      {open && pos && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={panelRef}
              id={`${listId}-listbox`}
              role="listbox"
              aria-label={ariaLabel}
              style={{
                position: "fixed",
                top: pos.placeAbove ? undefined : pos.top,
                bottom: pos.placeAbove
                  ? window.innerHeight - pos.top
                  : undefined,
                left: pos.left,
                // Grow to fit the longest option (no truncation) while never
                // shrinking below the trigger or overflowing the viewport.
                minWidth: pos.width,
                width: "max-content",
                maxWidth: Math.max(pos.width, window.innerWidth - pos.left - 8),
                maxHeight: pos.maxHeight,
              }}
              className="border-border-strong bg-raised z-100 overflow-y-auto rounded-[10px] border p-1 shadow-(--shadow-elev-2)"
            >
              {options.length === 0 ? (
                <div className="text-text-3 px-2.5 py-2 text-[12px]">
                  No options
                </div>
              ) : (
                options.map((option, i) => {
                  const isSelected = option.value === value;
                  const isActive = i === active;
                  return (
                    <div
                      key={option.value}
                      id={`${listId}-opt-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        select(option);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-colors",
                        isActive ? "bg-hover" : "",
                        isSelected ? "text-text font-medium" : "text-text-2",
                      )}
                    >
                      <span className="flex-1 whitespace-nowrap">
                        {option.label}
                      </span>
                      {isSelected ? (
                        <CheckIcon size={14} className="text-brand flex-none" />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
