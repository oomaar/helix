import type { Metadata } from "next";
import { IntegrationsView } from "@/features/integrations";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Integrations · Helix",
};

export default function IntegrationsPage() {
  return (
    <RequireScope scope="integrations">
      <IntegrationsView />
    </RequireScope>
  );
}
