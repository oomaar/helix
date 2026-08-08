import type { Metadata } from "next";
import { AnalyticsView } from "@/features/analytics";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Cost Analytics · Helix",
};

export default function AnalyticsPage() {
  return (
    <RequireScope scope="budgets">
      <AnalyticsView />
    </RequireScope>
  );
}
