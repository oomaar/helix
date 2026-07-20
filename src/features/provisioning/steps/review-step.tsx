"use client";

import type { ReactNode } from "react";
import { listBudgets, listTeams } from "@/lib/backend";
import { money } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge } from "@/shared/ui";
import { RESOURCE_TYPES, ROLE_OPTIONS } from "../constants";
import { completeTags, estimateCost } from "../helpers";
import type { ProvisionDraft } from "../types";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-text-3 text-[12px]">{label}</span>
      <span className="text-text min-w-0 text-right text-[12.5px] font-medium">
        {children}
      </span>
    </div>
  );
}

export function ReviewStep({ draft }: { draft: ProvisionDraft }) {
  const teams = useAsync(() => listTeams(), []);
  const budgets = useAsync(() => listBudgets(), []);

  const estimate = estimateCost(draft);
  const typeLabel =
    RESOURCE_TYPES.find((t) => t.value === draft.resourceType)?.label ??
    draft.resourceType;
  const teamName = teams.data?.find((t) => t.id === draft.teamId)?.name ?? "—";
  const monthly = budgets.data?.find(
    (b) => b.teamId === draft.teamId && b.period === "monthly",
  );
  const remaining = monthly ? monthly.amount - monthly.spent : null;
  const requiresApproval = remaining != null && estimate > remaining;

  const options = [
    draft.multiAz ? "Multi-AZ" : null,
    draft.encryption ? "Encrypted" : null,
    draft.perfInsights ? "Perf Insights" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const tags = completeTags(draft.tags);
  const roleLabels = draft.roles.map(
    (v) => ROLE_OPTIONS.find((r) => r.value === v)?.label ?? v,
  );

  return (
    <div className="space-y-4">
      <div className="border-border-token divide-border-token divide-y rounded-[8px] border px-3.5">
        <Row label="Name">{draft.name || "—"}</Row>
        <Row label="Type">{typeLabel}</Row>
        <Row label="Instance class">{draft.instanceClass}</Row>
        <Row label="Region · Env">
          {draft.region} · {draft.environment}
        </Row>
        <Row label="Team">{teamName}</Row>
        <Row label="Options">{options || "—"}</Row>
        <Row label="Access roles">
          {roleLabels.length ? roleLabels.join(", ") : "Inherited only"}
        </Row>
        <Row label="Tags">
          {tags.length
            ? tags.map((t) => `${t.key}=${t.value}`).join(", ")
            : "—"}
        </Row>
      </div>

      <div className="bg-surface-2 border-border-token flex items-center justify-between rounded-[8px] border px-3.5 py-3">
        <div>
          <div className="text-text-3 text-[11px]">Estimated monthly cost</div>
          <div className="text-text font-mono text-[20px] font-bold">
            {money(estimate)}
          </div>
        </div>
        {requiresApproval ? (
          <Badge tone="warn">Approval required</Badge>
        ) : (
          <Badge tone="success">Within budget</Badge>
        )}
      </div>

      {requiresApproval ? (
        <p className="text-text-2 text-[12px]">
          Estimated {money(estimate)}/mo exceeds the {teamName} team&rsquo;s
          remaining budget. This request will be routed for FinOps approval.
        </p>
      ) : null}
    </div>
  );
}
