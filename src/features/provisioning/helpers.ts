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

// --- validation ------------------------------------------------------------
// One validator per step; each returns an empty object when the step is valid.

export function validateBasics(draft: ProvisionDraft): StepErrors {
  const errors: Record<string, string> = {};
  const name = draft.name.trim();
  if (!name) errors.name = "Resource name is required.";
  else if (!/^[a-z0-9-]+$/.test(name)) {
    errors.name = "Use lowercase letters, numbers and hyphens only.";
  } else if (name.length < 3) {
    errors.name = "Use at least 3 characters.";
  }
  return errors;
}

export function validateConfiguration(draft: ProvisionDraft): StepErrors {
  const errors: Record<string, string> = {};
  const def = resourceTypeDef(draft.resourceType);
  if (def?.storage) {
    if (!draft.storageGb || draft.storageGb <= 0) {
      errors.storageGb = "Enter a storage size greater than 0.";
    } else if (draft.storageGb > 65536) {
      errors.storageGb = "Maximum provisionable storage is 65,536 GB.";
    }
  }
  return errors;
}

export function validateAccess(draft: ProvisionDraft): StepErrors {
  const errors: Record<string, string> = {};
  if (!draft.teamId) errors.teamId = "Select an owning team.";
  if (completeTags(draft.tags).length === 0) {
    errors.tags = "Add at least one complete cost-allocation tag.";
  } else {
    const keys = completeTags(draft.tags).map((t) =>
      t.key.trim().toLowerCase(),
    );
    if (new Set(keys).size !== keys.length) {
      errors.tags = "Tag keys must be unique.";
    }
  }
  return errors;
}
