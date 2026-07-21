"use client";

import { cn } from "@/lib/utils";
import { CheckIcon, ChevronDownIcon } from "@/shared/icons";
import { Button, Popover } from "@/shared/ui";
import { COLUMNS, type ColumnKey } from "../constants";

type ColumnsMenuProps = {
  visible: ReadonlySet<ColumnKey>;
  onToggle: (key: ColumnKey) => void;
};

export function ColumnsMenu({ visible, onToggle }: ColumnsMenuProps) {
  return (
    <Popover
      label="Toggle columns"
      panelClassName="w-52 p-1.5"
      button={({ toggle, open }) => (
        <Button
          size="sm"
          variant="secondary"
          aria-expanded={open}
          onClick={toggle}
        >
          Columns
          <ChevronDownIcon size={13} className="text-text-3" />
        </Button>
      )}
    >
      {() => (
        <>
          <div className="text-text-3 px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-wider uppercase">
            Visible columns
          </div>
          {COLUMNS.map((col) => {
            const on = visible.has(col.key);
            return (
              <button
                key={col.key}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onToggle(col.key)}
                className="hover:bg-hover flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-[12.5px]"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 flex-none items-center justify-center rounded-[5px] border",
                    on
                      ? "bg-brand border-brand text-white"
                      : "border-border-strong bg-surface",
                  )}
                >
                  {on ? <CheckIcon size={11} strokeWidth={3} /> : null}
                </span>
                <span className="text-text-2">{col.label}</span>
              </button>
            );
          })}
        </>
      )}
    </Popover>
  );
}
