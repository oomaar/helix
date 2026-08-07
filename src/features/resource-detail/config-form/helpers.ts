import {
  diffResourceConfig,
  type ConfigChange,
  type ResourceConfig,
  type ResourceConfigSnapshot,
} from "@/lib/backend";
import type { FieldErrors, WizardStepDef } from "@/shared/forms";
import { capabilitiesFor } from "./capabilities";
import type { ConfigDraft, TagRow } from "./types";

let tagSeq = 0;

export function newTagRow(): TagRow {
  tagSeq += 1;
  return { id: `cfg-tag-${tagSeq}`, key: "", value: "" };
}

export function configDraft(snapshot: ResourceConfigSnapshot): ConfigDraft {
  const { tags, ...rest } = snapshot.config;
  return {
    ...rest,
    tags: tags.map((t) => {
      tagSeq += 1;
      return { id: `cfg-tag-${tagSeq}`, key: t.key, value: t.value };
    }),
    applyWindow: "immediate",
    changeReason: "",
  };
}

export function completeTags(tags: readonly TagRow[]): TagRow[] {
  return tags.filter((t) => t.key.trim() && t.value.trim());
}

/** Draft back into the shape the API accepts. */
export function toConfig(draft: ConfigDraft): ResourceConfig {
  const { tags, applyWindow, changeReason, ...config } = draft;
  void applyWindow;
  void changeReason;
  return {
    ...config,
    tags: completeTags(tags).map((t) => ({
      key: t.key.trim(),
      value: t.value.trim(),
    })),
  };
}

export function changesFor(
  snapshot: ResourceConfigSnapshot,
  draft: ConfigDraft,
): readonly ConfigChange[] {
  return diffResourceConfig(snapshot.config, toConfig(draft));
}

// --- validation ------------------------------------------------------------

function validateSettings(
  snapshot: ResourceConfigSnapshot,
): (draft: ConfigDraft) => FieldErrors {
  const caps = capabilitiesFor(snapshot.kind);
  return (draft) => {
    const errors: Record<string, string> = {};

    if (caps.sizing) {
      if (!Number.isFinite(draft.instances) || draft.instances < 1) {
        errors.instances = "At least one instance is required.";
      } else if (draft.instances > 64) {
        errors.instances =
          "Scale beyond 64 instances needs a capacity request.";
      }
    }

    if (caps.autoscaling && draft.autoscaling) {
      if (draft.minInstances < 1) {
        errors.minInstances = "Minimum must be at least 1.";
      } else if (draft.minInstances > draft.instances) {
        errors.minInstances = "Minimum can't exceed the desired count.";
      }
      if (draft.maxInstances < draft.instances) {
        errors.maxInstances = "Maximum can't be below the desired count.";
      } else if (draft.maxInstances > 128) {
        errors.maxInstances = "Maximum is capped at 128 instances.";
      }
    }

    if (caps.availability && draft.multiAz) {
      if (draft.replicas < 1 || draft.replicas > 5) {
        errors.replicas = "Multi-AZ supports 1 to 5 replicas.";
      }
    }

    if (caps.storage) {
      if (!draft.storageGb || draft.storageGb <= 0) {
        errors.storageGb = "Enter a storage size greater than 0.";
      } else if (draft.storageGb < snapshot.config.storageGb) {
        errors.storageGb = "Storage can be grown but never shrunk in place.";
      } else if (draft.storageGb > 65536) {
        errors.storageGb = "Maximum volume size is 65,536 GB.";
      }
      if (draft.iops < 3000 || draft.iops > 80000) {
        errors.iops = "Provisioned IOPS run from 3,000 to 80,000.";
      }
    }

    if (!draft.encryptionKey.trim()) {
      errors.encryptionKey = "A KMS key is required.";
    } else if (!/^[a-z0-9-]+$/.test(draft.encryptionKey.trim())) {
      errors.encryptionKey = "Use lowercase letters, numbers and hyphens.";
    }

    if (
      caps.networkAccess &&
      draft.publicAccess &&
      draft.environment === "production"
    ) {
      errors.publicAccess =
        "Public access can't be enabled on a production resource.";
    }

    return errors;
  };
}

function validateTags(draft: ConfigDraft): FieldErrors {
  const errors: Record<string, string> = {};
  const complete = completeTags(draft.tags);
  if (complete.length === 0) {
    errors.tags = "Keep at least one tag for cost allocation.";
    return errors;
  }
  const keys = complete.map((t) => t.key.trim().toLowerCase());
  if (new Set(keys).size !== keys.length) {
    errors.tags = "Tag keys must be unique.";
  } else if (!keys.includes("cost-center")) {
    errors.tags = "A cost-center tag is required by the compliance policy.";
  }
  return errors;
}

function validateReview(
  snapshot: ResourceConfigSnapshot,
): (draft: ConfigDraft) => FieldErrors {
  return (draft) => {
    const errors: Record<string, string> = {};
    const changes = changesFor(snapshot, draft);

    if (changes.length === 0) {
      errors.changes = "Nothing has changed yet — edit a setting to continue.";
      return errors;
    }

    // A reason is only demanded for changes that actually interrupt service.
    if (
      changes.some((c) => c.disruptive) &&
      draft.changeReason.trim().length < 10
    ) {
      errors.changeReason =
        "Disruptive changes need a reason — it's recorded in the audit log.";
    }
    return errors;
  };
}

/**
 * Steps are built per resource so validators can close over the loaded baseline
 * (storage can't shrink, capabilities differ by kind).
 */
export function configSteps(
  snapshot: ResourceConfigSnapshot,
): readonly WizardStepDef<ConfigDraft>[] {
  return [
    {
      id: "settings",
      label: "Settings",
      description: "Sizing, availability and security",
      validate: validateSettings(snapshot),
    },
    {
      id: "tags",
      label: "Tags",
      description: "Allocation metadata",
      validate: validateTags,
    },
    {
      id: "review",
      label: "Review changes",
      description: "Confirm and apply",
      validate: validateReview(snapshot),
    },
  ];
}
