import type { Metadata } from "next";
import { DashboardView } from "@/features/dashboard";

export const metadata: Metadata = {
  title: "Cloud Operations Overview · Helix",
};

export default function DashboardPage() {
  return <DashboardView />;
}
