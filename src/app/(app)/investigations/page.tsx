import type { Metadata } from "next";
import { InvestigationsListView } from "@/features/investigation";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Investigations · Helix",
};

export default function InvestigationsPage() {
  return (
    <RequireScope scope="incidents">
      <InvestigationsListView />
    </RequireScope>
  );
}
