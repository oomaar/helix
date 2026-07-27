import type {
  FilterCondition,
  FilterField,
  FilterGroupNode,
  FilterOperator,
  ResourceWithRelations,
} from "@/lib/backend";
import { FILTER_FIELDS, OPERATORS_BY_TYPE } from "./constants";

let seq = 0;
const uid = (prefix: string) => `${prefix}-${(seq += 1)}`;

export function defaultOperatorFor(field: FilterField): FilterOperator {
  const def = FILTER_FIELDS.find((f) => f.field === field);
  return OPERATORS_BY_TYPE[def?.type ?? "text"][0]!;
}

export function newCondition(field: FilterField = "provider"): FilterCondition {
  return {
    id: uid("c"),
    kind: "condition",
    field,
    operator: defaultOperatorFor(field),
    value: "",
  };
}

export function newGroup(combinator: "and" | "or" = "or"): FilterGroupNode {
  return {
    id: uid("g"),
    kind: "group",
    combinator,
    children: [newCondition()],
  };
}

export function emptyFilter(): FilterGroupNode {
  return { id: "root", kind: "group", combinator: "and", children: [] };
}

/** Count leaf conditions with a non-empty value (for badges / "is filtered"). */
export function activeConditionCount(node: FilterGroupNode): number {
  let n = 0;
  const walk = (children: FilterGroupNode["children"]) => {
    for (const c of children) {
      if (c.kind === "condition") {
        if (c.value.trim()) n += 1;
      } else {
        walk(c.children);
      }
    }
  };
  walk(node.children);
  return n;
}

/** Flatten all leaf conditions that have a non-empty value (for chips). */
export function flattenConditions(node: FilterGroupNode): FilterCondition[] {
  const out: FilterCondition[] = [];
  const walk = (children: FilterGroupNode["children"]) => {
    for (const c of children) {
      if (c.kind === "condition") {
        if (c.value.trim()) out.push(c);
      } else {
        walk(c.children);
      }
    }
  };
  walk(node.children);
  return out;
}

/** Remove a condition by id and prune any groups left empty. */
export function removeConditionById(
  node: FilterGroupNode,
  id: string,
): FilterGroupNode {
  const children = node.children
    .filter((c) => c.id !== id)
    .map((c) => (c.kind === "group" ? removeConditionById(c, id) : c))
    .filter((c) => c.kind === "condition" || c.children.length > 0);
  return { ...node, children };
}

// --- CSV export ------------------------------------------------------------

const CSV_HEADERS = [
  "id",
  "name",
  "type",
  "status",
  "provider",
  "region",
  "environment",
  "team",
  "owner",
  "instances",
  "cpu",
  "monthlyCost",
] as const;

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(rows: readonly ResourceWithRelations[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.id,
        r.name,
        r.type,
        r.status,
        r.providerAccount?.provider ?? "",
        r.region,
        r.environment,
        r.team?.name ?? "",
        r.owner?.name ?? "",
        r.instances,
        r.cpu,
        r.monthlyCost,
      ]
        .map(csvCell)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Deterministic ~12-point CPU series around the resource's current value. */
export function cpuSeries(r: ResourceWithRelations): number[] {
  let h = 0;
  for (let i = 0; i < r.id.length; i += 1)
    h = (h * 31 + r.id.charCodeAt(i)) | 0;
  return Array.from({ length: 12 }, (_, i) => {
    const n = Math.abs(Math.sin(h + i * 1.7)) * 24 - 12;
    return Math.max(2, Math.min(99, Math.round(r.cpu + n)));
  });
}
