import type { Metadata } from "next";
import { IntegrationsView } from "@/features/integrations";

export const metadata: Metadata = {
  title: "Integrations · Helix",
};

export default function IntegrationsPage() {
  return <IntegrationsView />;
}
