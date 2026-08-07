"use client";

import type { PolicyCategory } from "@/lib/backend";
import { FormRow } from "@/shared/forms";
import { Field, Input, Select, Textarea } from "@/shared/ui";
import { CATEGORY_OPTIONS } from "../../constants";
import { suggestKey } from "../../helpers";
import type { PolicyStepProps } from "../../types";

export function DefinitionStep({ draft, set, errors }: PolicyStepProps) {
  /** Keep the key in step with the name until the author edits it directly. */
  const keyIsDerived =
    !draft.key || draft.key === suggestKey(draft.name, draft.category);

  return (
    <>
      <Field
        label="Policy name"
        htmlFor="policy-name"
        required
        error={errors.name}
      >
        <Input
          id="policy-name"
          autoFocus
          value={draft.name}
          placeholder="High-cost resources need FinOps approval"
          onChange={(e) => {
            const name = e.target.value;
            set({
              name,
              ...(keyIsDerived
                ? { key: suggestKey(name, draft.category) }
                : null),
            });
          }}
        />
      </Field>

      <FormRow>
        <Field label="Category" htmlFor="policy-category">
          <Select
            id="policy-category"
            value={draft.category}
            options={CATEGORY_OPTIONS}
            onChange={(value) => {
              const category = value as PolicyCategory;
              set({
                category,
                ...(keyIsDerived
                  ? { key: suggestKey(draft.name, category) }
                  : null),
              });
            }}
          />
        </Field>

        <Field
          label="Policy key"
          htmlFor="policy-key"
          required
          error={errors.key}
          hint="Stable identifier used in the API and audit log."
        >
          <Input
            id="policy-key"
            value={draft.key}
            placeholder="cost.large-spend-approval"
            className="font-mono"
            onChange={(e) => set({ key: e.target.value })}
          />
        </Field>
      </FormRow>

      <Field
        label="Description"
        htmlFor="policy-description"
        required
        error={errors.description}
        hint="Shown to resource owners when the policy fires."
      >
        <Textarea
          id="policy-description"
          rows={4}
          value={draft.description}
          invalid={Boolean(errors.description)}
          placeholder="Any production resource forecast above $12K/month must be reviewed by FinOps before it is provisioned."
          onChange={(e) => set({ description: e.target.value })}
        />
      </Field>
    </>
  );
}
