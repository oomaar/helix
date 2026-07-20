import {
  INSTANCE_BASE_COST,
  MULTI_AZ_MULTIPLIER,
  PERF_INSIGHTS_COST,
  RESOURCE_TYPES,
  resourceTypeDef,
  STORAGE_COST_PER_GB,
} from "./constants";
import type { ProvisionDraft, StepErrors, TagPair } from "./types";

let tagSeq = 0;

export function newTag(): TagPair {
  tagSeq += 1;
  return { id: `tag-${tagSeq}`, key: "", value: "" };
}

export function emptyDraft(): ProvisionDraft {
  const type = RESOURCE_TYPES[0]!;
  return {
    name: "",
    provider: "AWS",
    environment: "production",
    resourceType: type.value,
    instanceClass: type.instanceClasses[0]!,
    region: "us-east-1",
    storageGb: 500,
    multiAz: true,
    encryption: true,
    perfInsights: false,
    teamId: "",
    roles: [],
    tags: [newTag()],
  };
}

/** Live monthly cost estimate driven by the current configuration. */
export function estimateCost(draft: ProvisionDraft): number {
  const def = resourceTypeDef(draft.resourceType);
  const base = INSTANCE_BASE_COST[draft.instanceClass] ?? 0;
  let cost = base;
  if (def?.storage) cost += draft.storageGb * STORAGE_COST_PER_GB;
  if (def?.multiAz && draft.multiAz) cost += base * MULTI_AZ_MULTIPLIER;
  if (def?.perfInsights && draft.perfInsights) cost += PERF_INSIGHTS_COST;
  return Math.round(cost);
}

export function completeTags(tags: readonly TagPair[]): TagPair[] {
  return tags.filter((t) => t.key.trim() && t.value.trim());
}

/** Per-step validation. An empty object means the step is valid. */
export function validateStep(draft: ProvisionDraft, step: number): StepErrors {
  const errors: Record<string, string> = {};

  if (step === 0) {
    const name = draft.name.trim();
    if (!name) errors.name = "Resource name is required.";
    else if (!/^[a-z0-9-]+$/.test(name)) {
      errors.name = "Use lowercase letters, numbers and hyphens only.";
    }
  }

  if (step === 1) {
    const def = resourceTypeDef(draft.resourceType);
    if (def?.storage && (!draft.storageGb || draft.storageGb <= 0)) {
      errors.storageGb = "Enter a storage size greater than 0.";
    }
  }

  if (step === 2) {
    if (!draft.teamId) errors.teamId = "Select an owning team.";
    if (completeTags(draft.tags).length === 0) {
      errors.tags = "Add at least one complete cost-allocation tag.";
    }
  }

  return errors;
}
