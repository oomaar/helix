import type { Metadata } from "next";
import { InvestigationsListView } from "@/features/investigation";

export const metadata: Metadata = {
  title: "Investigations · Helix",
};

export default function InvestigationsPage() {
  return <InvestigationsListView />;
}
