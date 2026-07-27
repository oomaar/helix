import Link from "next/link";
import type { RelatedResource } from "@/lib/backend";
import { StatusDot } from "@/shared/ui";
import { STATUS_TONE } from "../constants";
import { SectionCard } from "./section-card";

type RelatedResourcesProps = { related: readonly RelatedResource[] };

export function RelatedResources({ related }: RelatedResourcesProps) {
  return (
    <SectionCard title="Related resources" bodyClassName="px-2.5 pb-2.5">
      {related.length === 0 ? (
        <p className="text-text-3 px-2 text-[12px]">No related resources.</p>
      ) : (
        <ul className="space-y-0.5">
          {related.map(({ resource, relationship }) => (
            <li key={resource.id}>
              <Link
                href={`/resources/${resource.id}`}
                className="hover:bg-hover flex items-center gap-2.5 rounded-md px-2 py-2 transition-colors"
              >
                <StatusDot tone={STATUS_TONE[resource.status]} />
                <div className="min-w-0 flex-1">
                  <div className="text-text truncate text-[12.5px] font-medium">
                    {resource.name}
                  </div>
                  <div className="text-text-3 truncate text-[11px]">
                    {relationship}
                  </div>
                </div>
                <span className="text-text-3 flex-none font-mono text-[10.5px]">
                  {resource.providerAccount?.provider}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
