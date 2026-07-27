import type { ConfigDiff, DiffLine } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { Badge, Card, CardBody, CardHeader, CardTitle } from "@/shared/ui";

type ConfigDiffPanelProps = { diff: ConfigDiff };

const LINE_STYLE: Record<DiffLine["type"], string> = {
  add: "bg-success-soft text-success",
  remove: "bg-danger-soft text-danger",
  context: "text-text-3",
};
const PREFIX: Record<DiffLine["type"], string> = {
  add: "+",
  remove: "-",
  context: " ",
};

export function ConfigDiffPanel({ diff }: ConfigDiffPanelProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Config diff</CardTitle>
        <div className="ml-auto flex items-center gap-2">
          <Badge tone="danger">SUSPECT</Badge>
          <span className="text-text-3 font-mono text-[11px]">
            {diff.fromVersion} → {diff.toVersion}
          </span>
        </div>
      </CardHeader>
      <CardBody>
        <div className="border-border-token overflow-hidden rounded-lg border">
          <div className="bg-surface-2 border-border-token text-text-3 flex items-center justify-between gap-2 border-b px-3 py-1.5 font-mono text-[11px]">
            <span className="truncate">
              {diff.suspect} · {diff.file}
            </span>
            <span className="flex-none">
              <span className="text-success">+{diff.added}</span>{" "}
              <span className="text-danger">−{diff.removed}</span>
            </span>
          </div>
          <pre className="overflow-x-auto py-1 font-mono text-[11.5px] leading-relaxed">
            {diff.lines.map((line, i) => (
              <div key={i} className={cn("px-3", LINE_STYLE[line.type])}>
                <span className="mr-2 inline-block w-2 opacity-70 select-none">
                  {PREFIX[line.type]}
                </span>
                {line.text}
              </div>
            ))}
          </pre>
        </div>
        <p className="text-text-2 mt-3 text-[12px]">
          <span className="text-danger font-semibold">Root cause. </span>
          {diff.rootCause}
        </p>
      </CardBody>
    </Card>
  );
}
