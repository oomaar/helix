"use client";

import type {
  PolicyCondition,
  PolicyField,
  PolicyOperator,
} from "@/lib/backend";
import { ChipGroup, Input, Select } from "@/shared/ui";
import {
  isListOperator,
  isValuelessOperator,
  OPERATOR_LABELS,
  policyFieldDef,
  POLICY_FIELDS,
} from "../constants";

type ConditionRowProps = {
  condition: PolicyCondition;
  onChange: (changes: Partial<PolicyCondition>) => void;
};

/**
 * One `field · operator · value` triple. The operator list and the value control
 * both derive from the selected field, and switching field resets whatever no
 * longer applies — the core conditional-field behaviour of the builder.
 */
export function ConditionRow({ condition, onChange }: ConditionRowProps) {
  const def = policyFieldDef(condition.field);

  const operatorOptions = def.operators.map((op) => ({
    value: op,
    label: OPERATOR_LABELS[op],
  }));

  const onFieldChange = (value: string) => {
    const next = policyFieldDef(value as PolicyField);
    const keepOperator = next.operators.includes(condition.operator);
    onChange({
      field: next.value,
      operator: keepOperator ? condition.operator : next.operators[0]!,
      value: next.value === condition.field ? condition.value : "",
    });
  };

  const selectedValues = condition.value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Select
        aria-label="Condition field"
        value={condition.field}
        options={POLICY_FIELDS.map((f) => ({ value: f.value, label: f.label }))}
        onChange={onFieldChange}
      />
      <Select
        aria-label="Condition operator"
        value={condition.operator}
        options={operatorOptions}
        onChange={(value) => {
          const operator = value as PolicyOperator;
          onChange({
            operator,
            // A list operator can hold what a single-value one held, but not
            // the other way around.
            value: isValuelessOperator(operator) ? "" : condition.value,
          });
        }}
      />

      {isValuelessOperator(condition.operator) ? null : def.control ===
          "enum" && def.options ? (
        <div className="sm:col-span-2">
          {isListOperator(condition.operator) ? (
            <ChipGroup
              ariaLabel="Condition values"
              value={selectedValues}
              options={def.options}
              onChange={(values) => onChange({ value: values.join(", ") })}
            />
          ) : (
            <Select
              aria-label="Condition value"
              value={condition.value}
              placeholder="Select a value"
              options={def.options}
              onChange={(value) => onChange({ value })}
            />
          )}
        </div>
      ) : (
        <div className="sm:col-span-2">
          <Input
            aria-label="Condition value"
            type={def.control === "number" ? "number" : "text"}
            value={condition.value}
            placeholder={def.placeholder}
            className="font-mono"
            trailing={
              def.unit ? (
                <span className="text-text-3 text-[11.5px]">{def.unit}</span>
              ) : undefined
            }
            onChange={(e) => onChange({ value: e.target.value })}
          />
          {def.hint ? (
            <p className="text-text-3 mt-1 text-[11px]">{def.hint}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
