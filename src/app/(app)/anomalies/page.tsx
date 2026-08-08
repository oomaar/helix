import type { Metadata } from "next";
import { AnomaliesView } from "@/features/anomalies";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Cost Anomalies · Helix",
};

export default function AnomaliesPage() {
  return (
    <RequireScope scope="budgets">
      <AnomaliesView />
    </RequireScope>
  );
}
