import type { Metadata } from "next";
import { AnomaliesView } from "@/features/anomalies";

export const metadata: Metadata = {
  title: "Cost Anomalies · Helix",
};

export default function AnomaliesPage() {
  return <AnomaliesView />;
}
