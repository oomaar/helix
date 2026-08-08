import type { Metadata } from "next";
import { ResourcesView } from "@/features/resources";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Resources · Helix",
};

export default function ResourcesPage() {
  return (
    <RequireScope scope="resources">
      <ResourcesView />
    </RequireScope>
  );
}
