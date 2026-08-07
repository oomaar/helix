import type { Metadata } from "next";
import { PoliciesView } from "@/features/policies";

export const metadata: Metadata = {
  title: "Policies · Helix",
};

export default function PoliciesPage() {
  return <PoliciesView />;
}
