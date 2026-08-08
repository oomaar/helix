import type {
  GridSortDirection,
  GridSortKey,
  ResourceGroup,
  ResourceWithRelations,
} from "@/lib/backend";
import type { ColumnDef, ColumnKey } from "../../constants";

export type SortState = { key: GridSortKey; direction: GridSortDirection };

export type ResourceTableProps = {
  columns: readonly ColumnDef[];
  rows: readonly ResourceWithRelations[] | null;
  groups: readonly ResourceGroup[] | null;
  sort: SortState;
  onSort: (key: GridSortKey) => void;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
  onToggleMany: (ids: string[], selected: boolean) => void;
  onOpen: (resource: ResourceWithRelations) => void;
  onQuickAction: (action: string, resource: ResourceWithRelations) => void;
  onContextMenu: (
    event: React.MouseEvent,
    resource: ResourceWithRelations,
  ) => void;
  allVisibleIds: readonly string[];
  /** Reorder by key — headers show only the visible subset of columns. */
  onMoveColumn: (fromKey: ColumnKey, toKey: ColumnKey) => void;
  onHideColumn: (key: ColumnKey) => void;
  onSortDirection: (key: GridSortKey, direction: GridSortDirection) => void;
};
