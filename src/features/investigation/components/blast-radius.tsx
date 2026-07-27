import type { BlastNode } from "@/lib/backend";
import { Card, CardBody, CardHeader, CardTitle, StatusDot } from "@/shared/ui";
import { BLAST_TONE } from "../constants";

type BlastRadiusProps = { nodes: readonly BlastNode[] };

const ROLE_LABEL: Record<BlastNode["role"], string> = {
  root: "Root cause",
  impacted: "Impacted",
  healthy: "Healthy",
};

export function BlastRadius({ nodes }: BlastRadiusProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Dependency &amp; blast radius</CardTitle>
        <span className="text-text-3 ml-auto text-[11px]">
          ranked by correlation with onset
        </span>
      </CardHeader>
      <CardBody>
        <ul className="space-y-1">
          {nodes.map((n) => (
            <li
              key={n.name}
              className="flex items-center gap-3 rounded-md px-2 py-1.5"
            >
              <StatusDot tone={BLAST_TONE[n.role]} />
              <div className="min-w-0 flex-1">
                <div className="text-text truncate text-[12.5px] font-medium">
                  {n.name}
                </div>
                <div className="text-text-3 truncate text-[11px] capitalize">
                  {n.detail}
                </div>
              </div>
              <span className="text-text-3 flex-none text-[10.5px] font-medium tracking-wide uppercase">
                {ROLE_LABEL[n.role]}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
