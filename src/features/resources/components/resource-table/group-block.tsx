import type { ResourceGroup } from "@/lib/backend";
import { cn, money } from "@/lib/utils";
import { ChevronRightIcon } from "@/shared/icons";
import { Badge, Checkbox } from "@/shared/ui";

type GroupBlockProps = {
  group: ResourceGroup;
  collapsed: boolean;
  colCount: number;
  onToggle: () => void;
  onToggleMany: (ids: string[], selected: boolean) => void;
  selected: ReadonlySet<string>;
  children: React.ReactNode;
};

export function GroupBlock({
  group,
  collapsed,
  colCount,
  onToggle,
  onToggleMany,
  selected,
  children,
}: GroupBlockProps) {
  const ids = group.items.map((r) => r.id);
  const allChecked = ids.every((id) => selected.has(id));
  const someChecked = ids.some((id) => selected.has(id));
  return (
    <>
      <tr className="border-border-token bg-surface-2/60 border-b">
        <td className="px-3 py-2">
          <Checkbox
            aria-label={`Select group ${group.label}`}
            checked={allChecked}
            indeterminate={!allChecked && someChecked}
            onChange={(v) => onToggleMany(ids, v)}
          />
        </td>
        <td colSpan={colCount - 1} className="px-2 py-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex cursor-pointer items-center gap-2"
          >
            <ChevronRightIcon
              size={14}
              className={cn(
                "text-text-3 transition-transform",
                !collapsed && "rotate-90",
              )}
            />
            <span className="text-text text-[12.5px] font-semibold capitalize">
              {group.label}
            </span>
            <Badge tone="neutral">{group.count}</Badge>
            <span className="text-text-3 font-mono text-[11.5px]">
              {money(group.monthlyCost)}/mo
            </span>
          </button>
        </td>
      </tr>
      {children}
    </>
  );
}
