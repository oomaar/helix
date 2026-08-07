"use client";

import { listBudgets, listTeams } from "@/lib/backend";
import { money } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import { ReviewGrid, type ReviewItem } from "@/shared/forms";
import { Badge, Callout } from "@/shared/ui";
import { RESOURCE_TYPES, ROLE_OPTIONS } from "../constants";
import { completeTags, estimateCost } from "../helpers";
import type { ProvisionDraft } from "../types";

type ReviewStepProps = {
  draft: ProvisionDraft;
  /** Lets the review send the user back to the step that owns a value. */
  onEditStep: (index: number) => void;
};

export function ReviewStep({ draft, onEditStep }: ReviewStepProps) {
  const teams = useAsync(() => listTeams(), []);
  const budgets = useAsync(() => listBudgets("monthly"), []);

  const estimate = estimateCost(draft);
  const typeLabel =
    RESOURCE_TYPES.find((t) => t.value === draft.resourceType)?.label ??
    draft.resourceType;
  const teamName = teams.data?.find((t) => t.id === draft.teamId)?.name ?? "—";
  const monthly = budgets.data?.find((b) => b.teamId === draft.teamId);
  const remaining = monthly ? monthly.amount - monthly.spent : null;
  const requiresApproval = remaining != null && estimate > remaining;

  const options =
    [
      draft.multiAz ? "Multi-AZ" : null,
      draft.encryption ? "Encrypted" : null,
      draft.perfInsights ? "Perf Insights" : null,
    ]
      .filter(Boolean)
      .join(" · ") || "—";

  const tags = completeTags(draft.tags);
  const roleLabels = draft.roles.map(
    (v) => ROLE_OPTIONS.find((r) => r.value === v)?.label ?? v,
  );

  const basics: readonly ReviewItem[] = [
    { label: "Name", value: draft.name || "—", mono: true },
    { label: "Type", value: typeLabel },
    { label: "Provider", value: draft.provider },
    { label: "Environment", value: draft.environment },
  ];

  const configuration: readonly ReviewItem[] = [
    { label: "Instance class", value: draft.instanceClass, mono: true },
    { label: "Region", value: draft.region, mono: true },
    {
      label: "Storage",
      value: `${draft.storageGb.toLocaleString()} GB`,
      mono: true,
    },
    { label: "Options", value: options },
  ];

  const access: readonly ReviewItem[] = [
    { label: "Owning team", value: teamName },
    {
      label: "Access roles",
      value: roleLabels.length ? roleLabels.join(", ") : "Inherited only",
    },
    {
      label: "Cost allocation tags",
      value: tags.length
        ? tags.map((t) => `${t.key}=${t.value}`).join(", ")
        : "—",
      mono: true,
      wide: true,
    },
  ];

  return (
    <>
      <ReviewGrid title="Basics" items={basics} onEdit={() => onEditStep(0)} />
      <ReviewGrid
        title="Configuration"
        items={configuration}
        onEdit={() => onEditStep(1)}
      />
      <ReviewGrid
        title="Access & tags"
        items={access}
        onEdit={() => onEditStep(2)}
      />

      <Callout
        tone={requiresApproval ? "warn" : "brand"}
        title="Estimated monthly cost"
        trailing={
          <div className="flex items-center gap-2.5">
            <span className="text-text font-mono text-[20px] font-bold">
              {money(estimate)}
            </span>
            {requiresApproval ? (
              <Badge tone="warn">Approval required</Badge>
            ) : (
              <Badge tone="success">Within budget</Badge>
            )}
          </div>
        }
      >
        {requiresApproval
          ? `Exceeds the ${teamName} team's remaining ${money(remaining ?? 0)} for this month — the request will be routed to FinOps for approval.`
          : "The request will be provisioned as soon as it is submitted."}
      </Callout>
    </>
  );
}
