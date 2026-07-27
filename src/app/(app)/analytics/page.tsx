import type { Metadata } from "next";
import { AnalyticsView } from "@/features/analytics";

export const metadata: Metadata = {
  title: "Cost Analytics · Helix",
};

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
