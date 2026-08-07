"use client";

import type { PolicyCondition, PolicyRule } from "@/lib/backend";
import { PlusIcon, TrashIcon } from "@/shared/icons";
import { FormSection } from "@/shared/forms";
import { Button, IconButton, Input, RadioGroup } from "@/shared/ui";
import { newCondition, newRule } from "../../helpers";
import { ConditionRow } from "../condition-row";
import { ImpactPreview } from "../impact-preview";
import type { PolicyStepProps } from "../../types";

const MATCH_OPTIONS = [
  { value: "all", label: "Match all" },
  { value: "any", label: "Match any" },
];

/**
 * Two levels of dynamic sections: repeatable rules, each holding repeatable
 * conditions. Rules are OR-ed, and each rule's conditions are combined with the
 * rule's own all/any setting.
 */
export function RulesStep({ draft, set, errors }: PolicyStepProps) {
  const patchRule = (id: string, changes: Partial<PolicyRule>) =>
    set({
      rules: draft.rules.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    });

  const patchCondition = (
    ruleId: string,
    conditionId: string,
    changes: Partial<PolicyCondition>,
  ) =>
    set({
      rules: draft.rules.map((r) =>
        r.id === ruleId
          ? {
              ...r,
              conditions: r.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...changes } : c,
              ),
            }
          : r,
      ),
    });

  return (
    <>
      <FormSection
        description={
          draft.rules.length > 1
            ? "A resource violates the policy when it matches any rule below."
            : "A resource violates the policy when it matches this rule."
        }
      >
        <div className="space-y-3">
          {draft.rules.map((rule, ruleIndex) => (
            <fieldset
              key={rule.id}
              className="border-border-token bg-surface-2 rounded-[10px] border p-3"
            >
              <legend className="sr-only">{rule.name}</legend>

              <div className="flex flex-wrap items-center gap-2">
                <Input
                  aria-label={`Rule ${ruleIndex + 1} name`}
                  value={rule.name}
                  placeholder="Rule name"
                  className="min-w-40 flex-1"
                  onChange={(e) => patchRule(rule.id, { name: e.target.value })}
                />
                <RadioGroup
                  ariaLabel={`${rule.name} condition matching`}
                  value={rule.match}
                  options={MATCH_OPTIONS}
                  onChange={(value) =>
                    patchRule(rule.id, { match: value as "all" | "any" })
                  }
                />
                <IconButton
                  size={28}
                  aria-label={`Remove ${rule.name}`}
                  disabled={draft.rules.length === 1}
                  onClick={() =>
                    set({ rules: draft.rules.filter((r) => r.id !== rule.id) })
                  }
                  className="disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <TrashIcon size={14} />
                </IconButton>
              </div>

              <div className="mt-3 space-y-2">
                {rule.conditions.map((condition, conditionIndex) => (
                  <div key={condition.id} className="flex items-start gap-2">
                    <span className="text-text-3 mt-2 w-8 flex-none font-mono text-[10.5px] uppercase">
                      {conditionIndex === 0
                        ? "if"
                        : rule.match === "all"
                          ? "and"
                          : "or"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <ConditionRow
                        condition={condition}
                        onChange={(changes) =>
                          patchCondition(rule.id, condition.id, changes)
                        }
                      />
                    </div>
                    <IconButton
                      size={28}
                      aria-label={`Remove condition ${conditionIndex + 1}`}
                      disabled={rule.conditions.length === 1}
                      onClick={() =>
                        patchRule(rule.id, {
                          conditions: rule.conditions.filter(
                            (c) => c.id !== condition.id,
                          ),
                        })
                      }
                      className="disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <TrashIcon size={14} />
                    </IconButton>
                  </div>
                ))}

                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-10 px-2"
                  onClick={() =>
                    patchRule(rule.id, {
                      conditions: [...rule.conditions, newCondition()],
                    })
                  }
                >
                  <PlusIcon size={13} />
                  Add condition
                </Button>
              </div>
            </fieldset>
          ))}

          {errors.rules ? (
            <p className="text-danger text-[11px]">{errors.rules}</p>
          ) : null}

          {draft.rules.length < 5 ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                set({ rules: [...draft.rules, newRule(draft.rules.length)] })
              }
            >
              <PlusIcon size={13} />
              Add rule
            </Button>
          ) : null}
        </div>
      </FormSection>

      <ImpactPreview draft={draft} />
    </>
  );
}
