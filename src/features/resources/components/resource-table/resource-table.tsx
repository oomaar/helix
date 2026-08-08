"use client";

import { useState } from "react";
import { useContextMenu } from "@/shared/hooks/use-context-menu";
import { useDragReorder } from "@/shared/hooks/use-drag-reorder";
import { Checkbox, ContextMenu, type ContextMenuItem } from "@/shared/ui";
import type { ColumnDef } from "../../constants";
import { GroupBlock } from "./group-block";
import { ResourceRow } from "./resource-row";
import { SortableHeader } from "./sortable-header";
import type { ResourceTableProps } from "./types";

export function ResourceTable({
  columns,
  rows,
  groups,
  sort,
  onSort,
  selected,
  onToggle,
  onToggleMany,
  onOpen,
  onQuickAction,
  onContextMenu,
  allVisibleIds,
  onMoveColumn,
  onHideColumn,
  onSortDirection,
}: ResourceTableProps) {
  const headerMenu = useContextMenu<ColumnDef>();
  const columnDrag = useDragReorder({
    count: columns.length,
    onReorder: (from, to) => onMoveColumn(columns[from]!.key, columns[to]!.key),
    describe: (index) => `${columns[index]?.label ?? "Column"} column`,
  });

  /** Per-column actions: the efficient path once the grip has taught it. */
  const headerMenuItems = (col: ColumnDef): readonly ContextMenuItem[] => {
    const index = columns.findIndex((c) => c.key === col.key);
    const left = columns[index - 1];
    const right = columns[index + 1];
    return [
      ...(col.sortKey
        ? ([
            {
              id: "asc",
              label: "Sort ascending",
              onSelect: () => onSortDirection(col.sortKey!, "asc"),
            },
            {
              id: "desc",
              label: "Sort descending",
              onSelect: () => onSortDirection(col.sortKey!, "desc"),
            },
          ] satisfies ContextMenuItem[])
        : []),
      {
        id: "left",
        label: "Move left",
        separatorBefore: Boolean(col.sortKey),
        disabled: !left,
        onSelect: () => left && onMoveColumn(col.key, left.key),
      },
      {
        id: "right",
        label: "Move right",
        disabled: !right,
        onSelect: () => right && onMoveColumn(col.key, right.key),
      },
      {
        id: "hide",
        label: "Hide column",
        tone: "danger",
        separatorBefore: true,
        disabled: columns.length <= 1,
        onSelect: () => onHideColumn(col.key),
      },
    ];
  };

  const [expanded, setExpanded] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set());
  const colCount = columns.length + 3;

  const allChecked =
    allVisibleIds.length > 0 && allVisibleIds.every((id) => selected.has(id));
  const someChecked = allVisibleIds.some((id) => selected.has(id));

  const toggleGroup = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderRow = (r: Parameters<typeof onOpen>[0]) => (
    <ResourceRow
      key={r.id}
      resource={r}
      columns={columns}
      selected={selected.has(r.id)}
      expanded={expanded === r.id}
      colCount={colCount}
      onToggleSelect={() => onToggle(r.id)}
      onToggleExpand={() => setExpanded((e) => (e === r.id ? null : r.id))}
      onOpen={() => onOpen(r)}
      onQuickAction={onQuickAction}
      onContextMenu={(event) => onContextMenu(event, r)}
    />
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-200 border-collapse text-left">
        <thead className="bg-surface-2 sticky top-0 z-10">
          <tr className="border-border-token border-b">
            <th className="w-9 px-3 py-2">
              <Checkbox
                aria-label="Select all on page"
                checked={allChecked}
                indeterminate={!allChecked && someChecked}
                onChange={(v) => onToggleMany([...allVisibleIds], v)}
              />
            </th>
            <SortableHeader
              label="Name"
              sortKey="name"
              sort={sort}
              onSort={onSort}
            />
            {columns.map((col, index) => (
              <SortableHeader
                key={col.key}
                label={col.label}
                sortKey={col.sortKey}
                align={col.align}
                sort={sort}
                onSort={onSort}
                reorder={{
                  cellProps: columnDrag.getRowProps(index),
                  handleProps: columnDrag.getHandleProps(index),
                  isDragging: columnDrag.draggingIndex === index,
                  isOver:
                    columnDrag.overIndex === index &&
                    columnDrag.draggingIndex !== index,
                }}
                onContextMenu={(event) => headerMenu.onContextMenu(event, col)}
              />
            ))}
            <th className="w-24 px-3 py-2" />
          </tr>
        </thead>

        <tbody>
          {groups
            ? groups.map((group) => {
                const isCollapsed = collapsed.has(group.key);
                return (
                  <GroupBlock
                    key={group.key}
                    group={group}
                    collapsed={isCollapsed}
                    colCount={colCount}
                    onToggle={() => toggleGroup(group.key)}
                    onToggleMany={onToggleMany}
                    selected={selected}
                  >
                    {!isCollapsed && group.items.map(renderRow)}
                  </GroupBlock>
                );
              })
            : rows?.map(renderRow)}
        </tbody>
      </table>

      {headerMenu.opened ? (
        <ContextMenu
          label={`${headerMenu.opened.target.label} column`}
          anchor={headerMenu.opened.anchor}
          items={headerMenuItems(headerMenu.opened.target)}
          onClose={headerMenu.close}
        />
      ) : null}

      <p aria-live="polite" className="sr-only">
        {columnDrag.announcement}
      </p>
    </div>
  );
}
