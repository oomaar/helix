"use client";

import type {
  AlertComparator,
  AlertCondition,
  AlertMetric,
} from "@/lib/backend";
import { FormSection, RepeatableList } from "@/shared/forms";
import { Field, Input, RadioGroup, Select } from "@/shared/ui";
import { COMPARATOR_OPTIONS, METRICS, metricDef } from "../../constants";
import { newCondition } from "../../helpers";
import { NoisePreview } from "../noise-preview";
import type { AlertStepProps } from "../../types";

const MATCH_OPTIONS = [
  { value: "all", label: "All conditions" },
  { value: "any", label: "Any condition" },
];

export function ConditionsStep({ draft, set, errors }: AlertStepProps) {
  const patch = (id: string, changes: Partial<AlertCondition>) =>
    set({
      conditions: draft.conditions.map((c) =>
        c.id === id ? { ...c, ...changes } : c,
      ),
    });

  const unusedMetrics = METRICS.filter(
    (m) => !draft.conditions.some((c) => c.metric === m.value),
  );

  return (
    <>
      {draft.conditions.length > 1 ? (
        <Field label="Fire when" hint="Combine the conditions below.">
          <RadioGroup
            ariaLabel="Condition matching"
            value={draft.match}
            options={MATCH_OPTIONS}
            onChange={(value) => set({ match: value as "all" | "any" })}
          />
        </Field>
      ) : null}

      <FormSection>
        <RepeatableList
          variant="card"
          items={draft.conditions}
          error={errors.conditions}
          minItems={1}
          maxItems={METRICS.length}
          addLabel="Add condition"
          onAdd={() => {
            const next = newCondition();
            const metric = unusedMetrics[0];
            set({
              conditions: [
                ...draft.conditions,
                metric
                  ? {
                      ...next,
                      metric: metric.value,
                      threshold: metric.defaultThreshold,
                      forMinutes: metric.supportsDuration ? 10 : 0,
                    }
                  : next,
              ],
            });
          }}
          onRemove={(id) =>
            set({ conditions: draft.conditions.filter((c) => c.id !== id) })
          }
          renderRow={(condition) => {
            const def = metricDef(condition.metric);
            return (
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Field label="Metric" htmlFor={`ac-metric-${condition.id}`}>
                    <Select
                      id={`ac-metric-${condition.id}`}
                      value={condition.metric}
                      options={METRICS.filter(
                        (m) =>
                          m.value === condition.metric ||
                          !draft.conditions.some((c) => c.metric === m.value),
                      ).map((m) => ({ value: m.value, label: m.label }))}
                      onChange={(value) => {
                        const next = metricDef(value as AlertMetric);
                        patch(condition.id, {
                          metric: next.value,
                          threshold: next.defaultThreshold,
                          forMinutes: next.supportsDuration
                            ? condition.forMinutes || 10
                            : 0,
                        });
                      }}
                    />
                  </Field>
                  <Field label="Comparator" htmlFor={`ac-cmp-${condition.id}`}>
                    <Select
                      id={`ac-cmp-${condition.id}`}
                      value={condition.comparator}
                      options={COMPARATOR_OPTIONS}
                      onChange={(value) =>
                        patch(condition.id, {
                          comparator: value as AlertComparator,
                        })
                      }
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <Field
                    label="Threshold"
                    htmlFor={`ac-th-${condition.id}`}
                    hint={def.hint}
                  >
                    <Input
                      id={`ac-th-${condition.id}`}
                      type="number"
                      min={1}
                      max={def.max}
                      value={String(condition.threshold)}
                      className="font-mono"
                      trailing={
                        def.unit ? (
                          <span className="text-text-3 text-[11.5px]">
                            {def.unit}
                          </span>
                        ) : undefined
                      }
                      onChange={(e) =>
                        patch(condition.id, {
                          threshold: Number(e.target.value),
                        })
                      }
                    />
                  </Field>

                  {/* Conditional: only sustained metrics take a duration. */}
                  {def.supportsDuration ? (
                    <Field
                      label="Sustained for"
                      htmlFor={`ac-for-${condition.id}`}
                      hint="0 fires on the first breaching sample."
                    >
                      <Input
                        id={`ac-for-${condition.id}`}
                        type="number"
                        min={0}
                        max={1440}
                        value={String(condition.forMinutes)}
                        className="font-mono"
                        trailing={
                          <span className="text-text-3 text-[11.5px]">min</span>
                        }
                        onChange={(e) =>
                          patch(condition.id, {
                            forMinutes: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ) : (
                    <div className="text-text-3 self-end pb-2 text-[11.5px]">
                      Evaluated on each reading — no sustained window applies.
                    </div>
                  )}
                </div>
              </div>
            );
          }}
        />
      </FormSection>

      <NoisePreview draft={draft} />
    </>
  );
}
