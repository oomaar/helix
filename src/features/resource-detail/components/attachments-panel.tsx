import { type Attachment, BACKEND_NOW } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import { Button, EmptyState } from "@/shared/ui";
import { SectionCard } from "./section-card";

type AttachmentsPanelProps = {
  attachments: readonly Attachment[];
  onAdd: () => void;
};

function fileSize(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export function AttachmentsPanel({
  attachments,
  onAdd,
}: AttachmentsPanelProps) {
  return (
    <SectionCard
      title="Attachments & runbooks"
      action={
        <Button size="sm" variant="secondary" onClick={onAdd}>
          Add
        </Button>
      }
      bodyClassName={attachments.length === 0 ? "px-0 pb-0" : undefined}
    >
      {attachments.length === 0 ? (
        <EmptyState
          title="No attachments"
          description="Runbooks and evidence files attached to this resource appear here."
          className="py-8"
        />
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="border-border-token flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <span className="text-text-3 bg-surface-2 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase">
                {a.mimeType.split("/")[1] ?? "file"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-text truncate text-[12.5px] font-medium">
                  {a.name}
                </div>
                <div className="text-text-3 text-[11px]">
                  {fileSize(a.sizeBytes)} ·{" "}
                  {relativeTime(a.uploadedAt, BACKEND_NOW)}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
