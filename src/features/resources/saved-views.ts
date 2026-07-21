import type {
  FilterCondition,
  FilterField,
  FilterGroupNode,
  FilterOperator,
} from "@/lib/backend";
import { newCondition } from "./helpers";

export type SavedView = {
  id: string;
  name: string;
  search: string;
  filter: FilterGroupNode;
};

function cond(
  field: FilterField,
  operator: FilterOperator,
  value: string,
): FilterCondition {
  return { ...newCondition(field), operator, value };
}

function group(children: FilterCondition[]): FilterGroupNode {
  return { id: "root", kind: "group", combinator: "and", children };
}

/** Built-in starting points shown under "Load saved…". */
export function presetViews(): SavedView[] {
  return [
    { id: "all", name: "All resources", search: "", filter: group([]) },
    {
      id: "production",
      name: "Production only",
      search: "",
      filter: group([cond("environment", "eq", "production")]),
    },
    {
      id: "degraded",
      name: "Degraded resources",
      search: "",
      filter: group([cond("status", "eq", "degraded")]),
    },
    {
      id: "aws",
      name: "AWS resources",
      search: "",
      filter: group([cond("provider", "eq", "AWS")]),
    },
    {
      id: "high-cost",
      name: "High cost (> $10K/mo)",
      search: "",
      filter: group([cond("monthlyCost", "gt", "10000")]),
    },
  ];
}
