import type { ResourceWithRelations } from "@/lib/backend";
import { Badge, type BadgeTone } from "@/shared/ui";

const TAG_TONES: readonly BadgeTone[] = ["neutral", "info", "brand"];

type TagListProps = {
  tags: ResourceWithRelations["tags"];
  max?: number;
};

export function TagList({ tags, max = 2 }: TagListProps) {
  if (tags.length === 0) return <span className="text-text-3">—</span>;
  const shown = tags.slice(0, max);
  const rest = tags.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {shown.map((t, i) => (
        <Badge key={t.key} tone={TAG_TONES[i % TAG_TONES.length]} mono={false}>
          {t.key}:{t.value}
        </Badge>
      ))}
      {rest > 0 ? (
        <span className="text-text-3 text-[10.5px]">+{rest}</span>
      ) : null}
    </div>
  );
}
