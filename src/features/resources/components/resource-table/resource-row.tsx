import type { ResourceWithRelations } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/shared/icons";
import { Button, Checkbox } from "@/shared/ui";
import type { ColumnDef } from "../../constants";
import { ResourceCell } from "../resource-cell";
import { Fact } from "./fact";

type ResourceRowProps = {
  resource: ResourceWithRelations;
  columns: readonly ColumnDef[];
  selected: boolean;
  expanded: boolean;
  colCount: number;
  onToggleSelect: () => void;
  onToggleExpand: () => void;
  onOpen: () => void;
  onQuickAction: (action: string, resource: ResourceWithRelations) => void;
};

export function ResourceRow({
  resource,
  columns,
  selected,
  expanded,
  colCount,
  onToggleSelect,
  onToggleExpand,
  onOpen,
  onQuickAction,
}: ResourceRowProps) {
  return (
    <>
      <tr
        onClick={onOpen}
        className={cn(
          "border-border-token hover:bg-hover cursor-pointer border-b transition-colors",
          selected && "bg-brand-soft/40",
        )}
      >
        <td className="px-3 py-2.5">
          <Checkbox
            aria-label={`Select ${resource.name}`}
            checked={selected}
            onChange={onToggleSelect}
          />
        </td>
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={expanded ? "Collapse row" : "Expand row"}
              aria-expanded={expanded}
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="hover:bg-hover flex h-5 w-5 flex-none cursor-pointer items-center justify-center rounded"
            >
              <ChevronRightIcon
                size={13}
                className={cn(
                  "text-text-3 transition-transform",
                  expanded && "rotate-90",
                )}
              />
            </button>
            <div className="min-w-0">
              <div className="text-text truncate text-[12.5px] font-medium">
                {resource.name}
              </div>
              <div className="text-text-3 truncate font-mono text-[10.5px]">
                {resource.type}
              </div>
            </div>
          </div>
        </td>
        {columns.map((col) => (
          <td
            key={col.key}
            className={cn("px-3 py-2.5", col.align === "right" && "text-right")}
          >
            <ResourceCell resource={resource} column={col.key} />
          </td>
        ))}
        <td className="px-3 py-2.5 text-right">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="text-brand hover:text-brand-2 cursor-pointer text-[12px] font-medium whitespace-nowrap"
          >
            Open detail →
          </button>
        </td>
      </tr>

      {expanded ? (
        <tr className="border-border-token bg-surface-2/40 border-b">
          <td />
          <td colSpan={colCount - 1} className="px-3 py-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <dl className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[12px] sm:grid-cols-4">
                <Fact label="Type" value={resource.kind} />
                <Fact label="Region" value={resource.region} />
                <Fact label="Instances" value={String(resource.instances)} />
                <Fact label="Memory" value={`${resource.mem}%`} />
              </dl>
              <div className="flex flex-wrap gap-2">
                {["Restart", "Edit config", "Optimize"].map((action) => (
                  <Button
                    key={action}
                    size="sm"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAction(action, resource);
                    }}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
