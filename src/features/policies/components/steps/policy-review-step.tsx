"use client";

import { listTeams } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { ReviewGrid, type ReviewItem } from "@/shared/forms";
import { Badge } from "@/shared/ui";
import {
  CATEGORY_LABELS,
  ENFORCEMENT_META,
  SCOPE_LABELS,
} from "../../constants";
import { describeRule, supportsExceptions } from "../../helpers";
import { ImpactPreview } from "../impact-preview";
import type { PolicyDraft } from "../../types";

type PolicyReviewStepProps = {
  draft: PolicyDraft;
  onEditStep: (index: number) => void;
};

export function PolicyReviewStep({ draft, onEditStep }: PolicyReviewStepProps) {
  const teams = useAsync(() => listTeams(), []);

  const scopeValueLabels =
    draft.scopeKind === "organization"
      ? ["All resources"]
      : draft.scopeKind === "team"
        ? draft.scopeValues.map(
            (id) => teams.data?.find((t) => t.id === id)?.name ?? id,
          )
        : draft.scopeValues;

  const definition: readonly ReviewItem[] = [
    { label: "Name", value: draft.name || "—" },
    { label: "Key", value: draft.key || "—", mono: true },
    { label: "Category", value: CATEGORY_LABELS[draft.category] },
    {
      label: "Enforcement",
      value: (
        <Badge tone={ENFORCEMENT_META[draft.enforcement].tone} mono={false}>
          {ENFORCEMENT_META[draft.enforcement].label}
        </Badge>
      ),
    },
    { label: "Description", value: draft.description || "—", wide: true },
  ];

  const scope: readonly ReviewItem[] = [
    { label: "Applies to", value: SCOPE_LABELS[draft.scopeKind] },
    {
      label: draft.scopeKind === "organization" ? "Coverage" : "Values",
      value: scopeValueLabels.join(", ") || "—",
    },
    {
      label: "Owner notifications",
      value: draft.notifyOwners ? "Enabled" : "Disabled",
    },
    {
      label: "State on save",
      value: draft.enabled ? "Enabled" : "Saved as draft",
    },
  ];

  return (
    <>
      <ReviewGrid
        title="Definition"
        items={definition}
        onEdit={() => onEditStep(0)}
      />
      <ReviewGrid title="Scope" items={scope} onEdit={() => onEditStep(1)} />

      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <h4 className="text-text-2 min-w-0 flex-1 text-[11.5px] font-semibold tracking-wide uppercase">
            Rules · violation when any matches
          </h4>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="text-brand cursor-pointer text-[11.5px] font-medium hover:underline"
          >
            Edit
          </button>
        </div>
        <ul className="border-border-token divide-border-token divide-y overflow-hidden rounded-[10px] border">
          {draft.rules.map((rule) => (
            <li key={rule.id} className="bg-surface px-3.5 py-2.5">
              <div className="text-text text-[12.5px] font-medium">
                {rule.name}
              </div>
              <div className="text-text-2 mt-0.5 font-mono text-[11.5px]">
                {describeRule(rule)}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {supportsExceptions(draft) && draft.exceptions.length > 0 ? (
        <ReviewGrid
          title="Exceptions"
          onEdit={() => onEditStep(4)}
          items={draft.exceptions.map((e) => ({
            label: teams.data?.find((t) => t.id === e.teamId)?.name ?? "Team",
            value: `${e.reason || "—"} · expires in ${e.expiresInDays} days`,
            wide: true,
          }))}
        />
      ) : null}

      <ImpactPreview draft={draft} />
    </>
  );
}
