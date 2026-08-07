import type { ConfigApplyWindow, ResourceConfig } from "@/lib/backend";
import type { FieldErrors } from "@/shared/forms";

export type TagRow = { id: string; key: string; value: string };

/**
 * The edit form's draft. Mirrors `ResourceConfig` except that tags carry a row
 * id (so the repeatable group keeps focus) and the draft also holds the change
 * management answers that aren't part of the resource itself.
 */
export type ConfigDraft = Omit<ResourceConfig, "tags"> & {
  tags: readonly TagRow[];
  applyWindow: ConfigApplyWindow;
  changeReason: string;
};

export type ConfigStepProps = {
  draft: ConfigDraft;
  set: (patch: Partial<ConfigDraft>) => void;
  errors: FieldErrors;
};
