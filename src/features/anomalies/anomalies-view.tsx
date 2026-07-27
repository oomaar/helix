"use client";

import { useState } from "react";
import {
  type AnomalyStatus,
  getAnomaliesSummary,
  listCostAnomalies,
  type Severity,
} from "@/lib/backend";
import { moneyCompact } from "@/lib/utils";
import { SearchIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, Card, Input, PageHeader, Select, Skeleton } from "@/shared/ui";
import { AnomaliesTable } from "./components/anomalies-table";
import { DetectionRulesDialog } from "./components/detection-rules-dialog";
import { SEVERITY_OPTIONS, STATUS_OPTIONS } from "./constants";

export function AnomaliesView() {
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<Severity | "all">("all");
  const [status, setStatus] = useState<AnomalyStatus | "all">("all");
  const [rulesOpen, setRulesOpen] = useState(false);

  const summary = useAsync(() => getAnomaliesSummary(), []);
  const anomalies = useAsync(
    () => listCostAnomalies({ search, severity, status }),
    [search, severity, status],
  );

  const stats = [
    {
      label: "At risk this cycle",
      value: summary.data ? moneyCompact(summary.data.atRisk) : null,
    },
    {
      label: "Open anomalies",
      value: summary.data ? String(summary.data.open) : null,
    },
    {
      label: "Total detected",
      value: summary.data ? String(summary.data.total) : null,
    },
  ];

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Cost Anomalies"
        description={
          summary.data
            ? `ML-detected spend deviations · ${moneyCompact(summary.data.atRisk)} at risk this cycle`
            : "ML-detected spend deviations."
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRulesOpen(true)}
          >
            Detection rules
          </Button>
        }
      />

      <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <div className="text-text-3 text-[11px] font-medium">{s.label}</div>
            {s.value === null ? (
              <Skeleton className="mt-1.5 h-6 w-20" />
            ) : (
              <div className="text-text mt-1 text-[22px] leading-none font-bold tracking-tight">
                {s.value}
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-56 flex-1"
          leading={<SearchIcon size={14} />}
          placeholder="Search by id, resource, team, provider…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="w-44"
          value={severity}
          options={[...SEVERITY_OPTIONS]}
          onChange={(v) => setSeverity(v as Severity | "all")}
        />
        <Select
          className="w-44"
          value={status}
          options={[...STATUS_OPTIONS]}
          onChange={(v) => setStatus(v as AnomalyStatus | "all")}
        />
      </div>

      <AnomaliesTable state={anomalies} />

      <DetectionRulesDialog
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
      />
    </div>
  );
}
