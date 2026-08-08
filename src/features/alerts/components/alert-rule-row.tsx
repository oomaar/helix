"use client";

import type { AlertRuleWithRelations } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { Badge, Button, Card, Switch } from "@/shared/ui";
import {
  CHANNEL_META,
  SCHEDULE_META,
  SEVERITY_META,
  TARGET_LABELS,
} from "../constants";
import { describeCondition } from "../helpers";

type AlertRuleRowProps = {
  rule: AlertRuleWithRelations;
  busy: boolean;
  onEdit: (rule: AlertRuleWithRelations) => void;
  onToggle: (rule: AlertRuleWithRelations, enabled: boolean) => void;
  onContextMenu: (
    event: React.MouseEvent,
    rule: AlertRuleWithRelations,
  ) => void;
};

export function AlertRuleRow({
  rule,
  busy,
  onEdit,
  onToggle,
  onContextMenu,
}: AlertRuleRowProps) {
  const severity = SEVERITY_META[rule.severity];
  const breaching = rule.enabled && rule.breaching > 0;

  return (
    <Card
      className={cn("p-4", !rule.enabled && "opacity-70")}
      onContextMenu={(event) => onContextMenu(event, rule)}
    >
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-text text-[13.5px] font-semibold">
              {rule.name}
            </h3>
            <Badge tone={severity.tone}>{rule.severity.toUpperCase()}</Badge>
            {breaching ? (
              <Badge tone="danger">{rule.breaching} breaching</Badge>
            ) : null}
            {!rule.enabled ? <Badge tone="neutral">Muted</Badge> : null}
            {rule.autoIncident ? (
              <Badge tone="info" mono={false}>
                Auto-incident
              </Badge>
            ) : null}
          </div>
          {rule.description ? (
            <p className="text-text-2 mt-1 text-[12px]">{rule.description}</p>
          ) : null}
        </div>

        <div className="flex flex-none items-center gap-2">
          <Switch
            checked={rule.enabled}
            disabled={busy}
            onChange={(value) => onToggle(rule, value)}
          />
          <Button size="sm" variant="secondary" onClick={() => onEdit(rule)}>
            Edit
          </Button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div>
          <div className="text-text-3 text-[10.5px] font-semibold tracking-wide uppercase">
            {rule.conditions.length > 1
              ? `${rule.match === "all" ? "All" : "Any"} of ${rule.conditions.length}`
              : "Condition"}
          </div>
          <ul className="mt-1 space-y-0.5">
            {rule.conditions.map((condition) => (
              <li
                key={condition.id}
                className="text-text-2 font-mono text-[11.5px]"
              >
                {describeCondition(condition)}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-text-3 text-[10.5px] font-semibold tracking-wide uppercase">
            {TARGET_LABELS[rule.target.kind]} · {rule.watched} watched
          </div>
          <p className="text-text-2 mt-1 text-[11.5px]">
            {rule.targetLabels.slice(0, 3).join(", ")}
            {rule.targetLabels.length > 3
              ? ` +${rule.targetLabels.length - 3}`
              : ""}
          </p>
          <p className="text-text-3 mt-0.5 text-[11px]">
            {SCHEDULE_META[rule.schedule].label} · suppress{" "}
            {rule.suppressionMinutes}m
          </p>
        </div>

        <div>
          <div className="text-text-3 text-[10.5px] font-semibold tracking-wide uppercase">
            Routing
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {rule.channels.map((channel) => (
              <Badge key={channel.id} tone="neutral" mono={false}>
                {CHANNEL_META[channel.kind].label} · {channel.target}
              </Badge>
            ))}
          </div>
          <p className="text-text-3 mt-1 text-[11px]">
            {rule.triggers7d} trigger{rule.triggers7d === 1 ? "" : "s"} in 7d
            {rule.escalateAfterMinutes > 0
              ? ` · escalates after ${rule.escalateAfterMinutes}m`
              : ""}
          </p>
        </div>
      </div>
    </Card>
  );
}
