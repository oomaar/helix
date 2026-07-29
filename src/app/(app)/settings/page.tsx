import type { Metadata } from "next";
import { OrganizationView } from "@/features/organization";

export const metadata: Metadata = {
  title: "Organization · Helix",
};

export default function SettingsPage() {
  return <OrganizationView />;
}
