"use client";

import type {
  FilterCondition,
  FilterField,
  FilterOperator,
} from "@/lib/backend";
import { CloseIcon } from "@/shared/icons";
import { IconButton, Input, Select } from "@/shared/ui";
import {
  FILTER_FIELDS,
  OPERATOR_LABEL,
  OPERATORS_BY_TYPE,
} from "../../constants";
import { defaultOperatorFor } from "../../helpers";
import type { FacetMap } from "./types";

type ConditionRowProps = {
  condition: FilterCondition;
  facets: FacetMap;
  onChange: (next: FilterCondition) => void;
  onRemove: () => void;
};

export function ConditionRow({
  condition,
  facets,
  onChange,
  onRemove,
}: ConditionRowProps) {
  const def = FILTER_FIELDS.find((f) => f.field === condition.field);
  const type = def?.type ?? "text";
  const operators = OPERATORS_BY_TYPE[type];
  const enumOptions = def?.facet ? (facets[def.facet] ?? []) : [];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Field"
        className="w-40"
        value={condition.field}
        options={FILTER_FIELDS.map((f) => ({ value: f.field, label: f.label }))}
        onChange={(value) => {
          const field = value as FilterField;
          onChange({
            ...condition,
            field,
            operator: defaultOperatorFor(field),
            value: "",
          });
        }}
      />
      <Select
        aria-label="Operator"
        className="w-32"
        value={condition.operator}
        options={operators.map((op) => ({
          value: op,
          label: OPERATOR_LABEL[op],
        }))}
        onChange={(value) =>
          onChange({ ...condition, operator: value as FilterOperator })
        }
      />
      {type === "enum" ? (
        <Select
          aria-label="Value"
          className="min-w-36 flex-1"
          placeholder="Select value"
          value={condition.value}
          options={enumOptions.map((v) => ({ value: v, label: v }))}
          onChange={(value) => onChange({ ...condition, value })}
        />
      ) : (
        <Input
          aria-label="Value"
          className="min-w-36 flex-1"
          type={type === "number" ? "number" : "text"}
          placeholder={type === "number" ? "0" : "value"}
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
        />
      )}
      <IconButton size={28} aria-label="Remove condition" onClick={onRemove}>
        <CloseIcon size={14} />
      </IconButton>
    </div>
  );
}
