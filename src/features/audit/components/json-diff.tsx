import type { JsonRecord } from "@/lib/backend";
import { cn } from "@/lib/utils";

type JsonDiffProps = {
  before: JsonRecord | null;
  after: JsonRecord | null;
};

type Line = { type: "add" | "remove" | "same"; text: string };

function fmt(value: string | number | boolean): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

function buildLines(
  before: JsonRecord | null,
  after: JsonRecord | null,
): Line[] {
  const keys = [
    ...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]),
  ];
  const lines: Line[] = [];
  for (const key of keys) {
    const inBefore = before != null && key in before;
    const inAfter = after != null && key in after;
    const oldV = inBefore ? before![key]! : undefined;
    const newV = inAfter ? after![key]! : undefined;
    if (inBefore && inAfter && oldV === newV) {
      lines.push({ type: "same", text: `${key}: ${fmt(oldV!)}` });
    } else {
      if (inBefore)
        lines.push({ type: "remove", text: `${key}: ${fmt(oldV!)}` });
      if (inAfter) lines.push({ type: "add", text: `${key}: ${fmt(newV!)}` });
    }
  }
  return lines;
}

const STYLE: Record<Line["type"], string> = {
  add: "bg-success-soft text-success",
  remove: "bg-danger-soft text-danger",
  same: "text-text-3",
};
const PREFIX: Record<Line["type"], string> = {
  add: "+",
  remove: "-",
  same: " ",
};

export function JsonDiff({ before, after }: JsonDiffProps) {
  const lines = buildLines(before, after);
  if (lines.length === 0) {
    return (
      <p className="text-text-3 text-[12px]">No field changes recorded.</p>
    );
  }
  return (
    <div className="border-border-token overflow-hidden rounded-lg border">
      <pre className="overflow-x-auto py-1 font-mono text-[11.5px] leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className={cn("px-3", STYLE[line.type])}>
            <span className="mr-2 inline-block w-2 opacity-70 select-none">
              {PREFIX[line.type]}
            </span>
            {line.text}
          </div>
        ))}
      </pre>
    </div>
  );
}
