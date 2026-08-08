import type { Metadata } from "next";
import { OrganizationView } from "@/features/organization";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Organization · Helix",
};

export default function SettingsPage() {
  return (
    <RequireScope scope="users">
      <OrganizationView />
    </RequireScope>
  );
}
