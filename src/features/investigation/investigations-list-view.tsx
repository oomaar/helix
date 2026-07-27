"use client";

import { useState } from "react";
import {
  type InvestigationStatusFilter,
  listInvestigations,
  type Severity,
} from "@/lib/backend";
import { SearchIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { Input, PageHeader, Select } from "@/shared/ui";
import { InvestigationsTable } from "./components/investigations-table";

const STATUS_OPTIONS: readonly {
  value: InvestigationStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
];

const SEVERITY_OPTIONS: readonly { value: Severity | "all"; label: string }[] =
  [
    { value: "all", label: "All severities" },
    { value: "sev1", label: "SEV1" },
    { value: "sev2", label: "SEV2" },
    { value: "sev3", label: "SEV3" },
  ];

export function InvestigationsListView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<InvestigationStatusFilter>("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");

  const state = useAsync(
    () => listInvestigations({ search, status, severity }),
    [search, status, severity],
  );

  const count = state.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Investigations"
        description={`Active and past incident investigations · ${count} shown`}
      />

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-56 flex-1"
          leading={<SearchIcon size={14} />}
          placeholder="Search by title, resource, owner…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="w-44"
          value={status}
          options={[...STATUS_OPTIONS]}
          onChange={(v) => setStatus(v as InvestigationStatusFilter)}
        />
        <Select
          className="w-44"
          value={severity}
          options={[...SEVERITY_OPTIONS]}
          onChange={(v) => setSeverity(v as Severity | "all")}
        />
      </div>

      <InvestigationsTable state={state} />
    </div>
  );
}
