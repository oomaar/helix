import type { AccessGrant, PermissionAction } from "@/lib/backend";
import { Badge, type BadgeTone, Button } from "@/shared/ui";
import { SectionCard } from "./section-card";

type AccessControlProps = {
  access: readonly AccessGrant[];
  onGrant: () => void;
};

const GRANT_TONE: Record<PermissionAction, BadgeTone> = {
  override: "brand",
  edit: "success",
  view: "neutral",
  none: "neutral",
};

const GRANT_LABEL: Record<PermissionAction, string> = {
  override: "Full",
  edit: "Edit",
  view: "View only",
  none: "No access",
};

export function AccessControl({ access, onGrant }: AccessControlProps) {
  return (
    <SectionCard
      title="Access control"
      action={
        <Button size="sm" variant="secondary" onClick={onGrant}>
          Grant access
        </Button>
      }
    >
      <ul className="space-y-2">
        {access.map((a) => (
          <li
            key={a.role}
            className="flex items-center justify-between gap-3 text-[12.5px]"
          >
            <span className="text-text-2 capitalize">{a.role}</span>
            <Badge tone={GRANT_TONE[a.grant]}>{GRANT_LABEL[a.grant]}</Badge>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
