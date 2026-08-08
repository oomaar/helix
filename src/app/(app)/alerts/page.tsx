import type { Metadata } from "next";
import { AlertRulesView } from "@/features/alerts";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Alert rules · Helix",
};

export default function AlertsPage() {
  return (
    <RequireScope scope="alerts">
      <AlertRulesView />
    </RequireScope>
  );
}
