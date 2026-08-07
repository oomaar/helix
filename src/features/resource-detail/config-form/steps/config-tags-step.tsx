"use client";

import { FormSection, RepeatableList } from "@/shared/forms";
import { Callout, Input } from "@/shared/ui";
import { newTagRow } from "../helpers";
import type { ConfigStepProps } from "../types";

export function ConfigTagsStep({ draft, set, errors }: ConfigStepProps) {
  const patch = (
    id: string,
    changes: Partial<{ key: string; value: string }>,
  ) =>
    set({
      tags: draft.tags.map((t) => (t.id === id ? { ...t, ...changes } : t)),
    });

  return (
    <>
      <FormSection
        title="Resource tags"
        description="Tags drive chargeback, policy evaluation and reporting."
      >
        <RepeatableList
          items={draft.tags}
          error={errors.tags}
          minItems={1}
          maxItems={12}
          addLabel="Add tag"
          onAdd={() => set({ tags: [...draft.tags, newTagRow()] })}
          onRemove={(id) =>
            set({ tags: draft.tags.filter((t) => t.id !== id) })
          }
          renderRow={(tag) => (
            <div className="flex items-center gap-2">
              <Input
                aria-label="Tag key"
                placeholder="key"
                value={tag.key}
                className="flex-1 font-mono"
                onChange={(e) => patch(tag.id, { key: e.target.value })}
              />
              <Input
                aria-label="Tag value"
                placeholder="value"
                value={tag.value}
                className="flex-1 font-mono"
                onChange={(e) => patch(tag.id, { value: e.target.value })}
              />
            </div>
          )}
        />
      </FormSection>

      <Callout tone="info" title="Required by policy">
        The <span className="font-mono">cost-center</span> tag is enforced by
        the{" "}
        <span className="text-text font-medium">
          Cost-center tag on every resource
        </span>{" "}
        compliance policy. Removing it will raise a violation.
      </Callout>
    </>
  );
}
