"use client";

import type { PolicyWithRelations } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Switch } from "@/shared/ui";
import { CATEGORY_LABELS, CATEGORY_TONE, ENFORCEMENT_META } from "../constants";
import { describeRule } from "../helpers";

type PolicyCardProps = {
  policy: PolicyWithRelations;
  busy: boolean;
  onEdit: (policy: PolicyWithRelations) => void;
  onToggle: (policy: PolicyWithRelations, enabled: boolean) => void;
  onContextMenu: (event: React.MouseEvent, policy: PolicyWithRelations) => void;
};

export function PolicyCard({
  policy,
  busy,
  onEdit,
  onToggle,
  onContextMenu,
}: PolicyCardProps) {
  const enforcement = ENFORCEMENT_META[policy.enforcement];
  const compliant = policy.violations === 0;

  return (
    <Card
      interactive
      className={cn("p-4", !policy.enabled && "opacity-70")}
      onContextMenu={(event) => onContextMenu(event, policy)}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-text text-[13.5px] font-semibold">
              {policy.name}
            </h3>
            <Badge tone={CATEGORY_TONE[policy.category]} mono={false}>
              {CATEGORY_LABELS[policy.category]}
            </Badge>
            <Badge tone={enforcement.tone} mono={false}>
              {enforcement.label}
            </Badge>
            {!policy.enabled ? <Badge tone="neutral">Disabled</Badge> : null}
          </div>
          <p className="text-text-3 mt-0.5 font-mono text-[11px]">
            {policy.key}
          </p>
        </div>
        <Switch
          checked={policy.enabled}
          disabled={busy}
          onChange={(value) => onToggle(policy, value)}
        />
      </div>

      <p className="text-text-2 mt-2 line-clamp-2 text-[12px]">
        {policy.description}
      </p>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        <div>
          <dt className="text-text-3 text-[10.5px]">Violations</dt>
          <dd
            className={cn(
              "mt-0.5 font-mono text-[15px] font-bold",
              compliant ? "text-success" : "text-danger",
            )}
          >
            {policy.violations}
          </dd>
        </div>
        <div>
          <dt className="text-text-3 text-[10.5px]">In scope</dt>
          <dd className="text-text mt-0.5 font-mono text-[15px] font-bold">
            {policy.evaluated}
          </dd>
        </div>
        <div>
          <dt className="text-text-3 text-[10.5px]">Exceptions</dt>
          <dd className="text-text mt-0.5 font-mono text-[15px] font-bold">
            {policy.exceptions.length}
          </dd>
        </div>
      </dl>

      <div className="border-border-token mt-3 border-t pt-2.5">
        <div className="text-text-3 text-[10.5px] font-semibold tracking-wide uppercase">
          {policy.rules.length === 1
            ? "Rule"
            : `${policy.rules.length} rules · violation on any match`}
        </div>
        <ul className="mt-1 space-y-0.5">
          {policy.rules.slice(0, 2).map((rule) => (
            <li
              key={rule.id}
              className="text-text-2 truncate font-mono text-[11px]"
              title={describeRule(rule)}
            >
              {describeRule(rule)}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-text-3 truncate text-[11px]">
          {policy.scopeLabels.slice(0, 2).join(", ")}
          {policy.scopeLabels.length > 2
            ? ` +${policy.scopeLabels.length - 2}`
            : ""}
        </span>
        <Button size="sm" variant="secondary" onClick={() => onEdit(policy)}>
          Edit policy
        </Button>
      </div>
    </Card>
  );
}
