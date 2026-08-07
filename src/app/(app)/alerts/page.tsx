import type { Metadata } from "next";
import { AlertRulesView } from "@/features/alerts";

export const metadata: Metadata = {
  title: "Alert rules · Helix",
};

export default function AlertsPage() {
  return <AlertRulesView />;
}
