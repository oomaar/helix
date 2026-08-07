"use client";

import { useState } from "react";
import {
  type AttributionDimension,
  getCostBandDistribution,
  getOptimizationRecommendations,
  getSpendAttribution,
  getSpendByType,
  getSpendTrend,
  type Recommendation,
} from "@/lib/backend";
import { printDocument } from "@/lib/utils";
import { DownloadIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import { Button, PageHeader, Select, Toast, useToast } from "@/shared/ui";
import { AttributionPanel } from "./components/attribution-panel";
import { CostBandPanel } from "./components/cost-band-panel";
import { RecommendationsPanel } from "./components/recommendations-panel";
import { SpendByTypePanel } from "./components/spend-by-type-panel";
import { SpendTrendPanel } from "./components/spend-trend-panel";
import { DIMENSION_OPTIONS } from "./constants";

export function AnalyticsView() {
  const [dimension, setDimension] = useState<AttributionDimension>("team");
  const [applied, setApplied] = useState<ReadonlySet<string>>(new Set());
  const toast = useToast();

  const attribution = useAsync(
    () => getSpendAttribution(dimension),
    [dimension],
  );
  const trend = useAsync(() => getSpendTrend(12), []);
  const byType = useAsync(() => getSpendByType(), []);
  const costBand = useAsync(() => getCostBandDistribution(), []);
  const recs = useAsync(() => getOptimizationRecommendations(), []);

  const onApply = (rec: Recommendation) => {
    setApplied((prev) => new Set(prev).add(rec.id));
    toast.show(`Applied: ${rec.title}`);
  };

  const dimensionLabel =
    DIMENSION_OPTIONS.find((d) => d.value === dimension)?.label ?? "Team";

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Cost Analytics"
        description="Spend attribution, trends and optimization across teams · trailing 12 months"
        actions={
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-text-3 text-[11px]">Group</span>
              <Select
                className="w-36"
                value={dimension}
                options={[...DIMENSION_OPTIONS]}
                onChange={(v) => setDimension(v as AttributionDimension)}
              />
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => printDocument("Helix — Cost Analytics")}
            >
              <DownloadIcon size={14} />
              Export report
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3.5">
        <AttributionPanel
          state={attribution}
          dimensionLabel={dimensionLabel}
          className="col-span-12 xl:col-span-8"
        />
        <SpendByTypePanel
          state={byType}
          className="col-span-12 xl:col-span-4"
        />
        <SpendTrendPanel state={trend} className="col-span-12 xl:col-span-8" />
        <CostBandPanel state={costBand} className="col-span-12 xl:col-span-4" />
        <RecommendationsPanel
          state={recs}
          applied={applied}
          onApply={onApply}
          className="col-span-12"
        />
      </div>

      <Toast message={toast.message} />
    </div>
  );
}
