import Link from "next/link";
import { DownloadIcon, PlusIcon } from "@/shared/icons";
import { Button, PageHeader } from "@/shared/ui";
import { ActiveAlertsPanel } from "./panels/active-alerts-panel";
import { RecentActivityPanel } from "./panels/recent-activity-panel";
import { RegionUtilizationPanel } from "./panels/region-utilization-panel";
import { SavedViewsPanel } from "./panels/saved-views-panel";
import { SpendByDimensionPanel } from "./panels/spend-by-dimension-panel";
import { SpendByServicePanel } from "./panels/spend-by-service-panel";
import { SpendForecastPanel } from "./panels/spend-forecast-panel";

/**
 * "Cloud Operations Overview" — the dashboard entry point.
 * Each panel fetches independently and owns its loading/empty/error states, so
 * the grid streams in progressively rather than blocking on a single request.
 */
export function DashboardView() {
  return (
    <div className="mx-auto max-w-350 p-[22px_26px_60px]">
      <PageHeader
        title="Cloud Operations Overview"
        description="Consolidated spend, utilization and health across all providers."
        actions={
          <>
            <Button size="sm" variant="secondary">
              <DownloadIcon size={14} />
              Export
            </Button>
            <Link href="/resources">
              <Button size="sm" variant="primary">
                <PlusIcon size={14} />
                Provision resource
              </Button>
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3.5">
        <SpendForecastPanel className="col-span-12 xl:col-span-8" />
        <SpendByDimensionPanel className="col-span-12 md:col-span-6 xl:col-span-4" />
        <SpendByServicePanel className="col-span-12 md:col-span-6 xl:col-span-5" />
        <RegionUtilizationPanel className="col-span-12 md:col-span-6 xl:col-span-4" />
        <ActiveAlertsPanel className="col-span-12 md:col-span-6 xl:col-span-3" />
        <RecentActivityPanel className="col-span-12 xl:col-span-8" />
        <SavedViewsPanel className="col-span-12 md:col-span-6 xl:col-span-4" />
      </div>
    </div>
  );
}
