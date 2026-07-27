import type { Metadata } from "next";
import { OperationsView } from "@/features/operations";

export const metadata: Metadata = {
  title: "Operations Center · Helix",
};

export default function OperationsPage() {
  return <OperationsView />;
}
