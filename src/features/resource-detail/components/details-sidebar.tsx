import type { ResourceWithRelations } from "@/lib/backend";
import { Avatar, Badge } from "@/shared/ui";
import { SectionCard } from "./section-card";

type DetailsSidebarProps = { resource: ResourceWithRelations };

export function DetailsSidebar({ resource }: DetailsSidebarProps) {
  return (
    <SectionCard title="Details">
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={resource.owner?.name ?? "Unknown"} size={30} />
          <div className="min-w-0">
            <div className="text-text truncate text-[12.5px] font-medium">
              {resource.owner?.name ?? "Unassigned"}
            </div>
            <div className="text-text-3 text-[11px]">Owner</div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {[
            ["Team", resource.team?.name ?? "—"],
            ["Environment", resource.environment],
            ["Instances", String(resource.instances)],
            ["Memory", `${resource.mem}%`],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-text-3 text-[11px]">{label}</dt>
              <dd className="text-text-2 text-[12.5px] capitalize">{value}</dd>
            </div>
          ))}
        </dl>

        <div>
          <div className="text-text-3 mb-1.5 text-[11px]">Tags</div>
          <div className="flex flex-wrap gap-1.5">
            {resource.tags.length === 0 ? (
              <span className="text-text-3 text-[12px]">No tags</span>
            ) : (
              resource.tags.map((t) => (
                <Badge key={t.key} tone="neutral" mono={false}>
                  {t.key}:{t.value}
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
