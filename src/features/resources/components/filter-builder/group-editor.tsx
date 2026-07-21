"use client";

import type { FilterGroupNode, FilterNode } from "@/lib/backend";
import { CloseIcon, PlusIcon } from "@/shared/icons";
import { Button, IconButton, RadioGroup } from "@/shared/ui";
import { newCondition, newGroup } from "../../helpers";
import { ConditionRow } from "./condition-row";
import type { FacetMap } from "./types";

type GroupEditorProps = {
  node: FilterGroupNode;
  facets: FacetMap;
  depth: number;
  onChange: (node: FilterGroupNode) => void;
  onRemove?: () => void;
};

export function GroupEditor({
  node,
  facets,
  depth,
  onChange,
  onRemove,
}: GroupEditorProps) {
  const replaceChild = (id: string, next: FilterNode) =>
    onChange({
      ...node,
      children: node.children.map((c) => (c.id === id ? next : c)),
    });
  const removeChild = (id: string) =>
    onChange({ ...node, children: node.children.filter((c) => c.id !== id) });

  return (
    <div
      className={
        depth > 0
          ? "border-border-token bg-surface-2 rounded-lg border p-2.5"
          : ""
      }
    >
      <div className="mb-2 flex items-center gap-2 text-[12px]">
        <span className="text-text-3">match</span>
        <RadioGroup
          ariaLabel="Combinator"
          value={node.combinator}
          onChange={(v) => onChange({ ...node, combinator: v as "and" | "or" })}
          options={[
            { value: "and", label: "ALL (AND)" },
            { value: "or", label: "ANY (OR)" },
          ]}
        />
        <span className="text-text-3">of the following</span>
        {onRemove ? (
          <IconButton
            size={28}
            aria-label="Remove group"
            className="ml-auto"
            onClick={onRemove}
          >
            <CloseIcon size={14} />
          </IconButton>
        ) : null}
      </div>

      <div className="space-y-2">
        {node.children.length === 0 ? (
          <p className="text-text-3 text-[12px]">No conditions yet.</p>
        ) : null}
        {node.children.map((child) =>
          child.kind === "condition" ? (
            <ConditionRow
              key={child.id}
              condition={child}
              facets={facets}
              onChange={(next) => replaceChild(child.id, next)}
              onRemove={() => removeChild(child.id)}
            />
          ) : (
            <GroupEditor
              key={child.id}
              node={child}
              facets={facets}
              depth={depth + 1}
              onChange={(next) => replaceChild(child.id, next)}
              onRemove={() => removeChild(child.id)}
            />
          ),
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange({ ...node, children: [...node.children, newCondition()] })
          }
        >
          <PlusIcon size={13} />
          Add condition
        </Button>
        {depth < 1 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange({ ...node, children: [...node.children, newGroup()] })
            }
          >
            <PlusIcon size={13} />
            Add nested group
          </Button>
        ) : null}
      </div>
    </div>
  );
}
