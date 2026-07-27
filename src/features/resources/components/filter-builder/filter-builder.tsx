"use client";

import type { FilterGroupNode } from "@/lib/backend";
import { GroupEditor } from "./group-editor";
import type { FacetMap } from "./types";

type FilterBuilderProps = {
  node: FilterGroupNode;
  facets: FacetMap;
  onChange: (node: FilterGroupNode) => void;
};

export function FilterBuilder({ node, facets, onChange }: FilterBuilderProps) {
  return (
    <GroupEditor node={node} facets={facets} depth={0} onChange={onChange} />
  );
}
