import type { Metadata } from "next";
import { ResourcesView } from "@/features/resources";

export const metadata: Metadata = {
  title: "Resources · Helix",
};

export default function ResourcesPage() {
  return <ResourcesView />;
}
