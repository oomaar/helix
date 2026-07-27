import { BACKEND_NOW, type ResourceWithRelations } from "@/lib/backend";
import { money, relativeTime } from "@/lib/utils";
import { StatusDot } from "@/shared/ui";
import { type ColumnKey, STATUS_TONE } from "../../constants";
import { CpuBar } from "./cpu-bar";
import { TagList } from "./tag-list";

type ResourceCellProps = {
  resource: ResourceWithRelations;
  column: ColumnKey;
};

/** Renders one table cell's content for a given column key. */
export function ResourceCell({ resource, column }: ResourceCellProps) {
  switch (column) {
    case "status":
      return (
        <span className="text-text-2 inline-flex items-center gap-1.5 text-[12px] capitalize">
          <StatusDot tone={STATUS_TONE[resource.status]} />
          {resource.status}
        </span>
      );
    case "provider":
      return (
        <div className="min-w-0">
          <div className="text-text-2 text-[12.5px]">
            {resource.providerAccount?.provider ?? "—"}
          </div>
          <div className="text-text-3 font-mono text-[10.5px]">
            {resource.region}
          </div>
        </div>
      );
    case "environment":
      return (
        <span className="text-text-2 text-[12px] capitalize">
          {resource.environment}
        </span>
      );
    case "team":
      return (
        <span className="text-text-2 truncate text-[12.5px]">
          {resource.team?.name ?? "—"}
        </span>
      );
    case "instances":
      return (
        <span className="text-text-2 font-mono text-[12.5px]">
          {resource.instances}
        </span>
      );
    case "cpu":
      return <CpuBar value={resource.cpu} />;
    case "monthlyCost":
      return (
        <span className="text-text font-mono text-[12.5px] font-medium">
          {money(resource.monthlyCost)}
        </span>
      );
    case "updatedAt":
      return (
        <span className="text-text-3 text-[12px]">
          {relativeTime(resource.updatedAt, BACKEND_NOW)}
        </span>
      );
    case "tags":
      return <TagList tags={resource.tags} />;
    default:
      return null;
  }
}
