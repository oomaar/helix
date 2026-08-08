import type { Metadata } from "next";
import { OperationsView } from "@/features/operations";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Operations Center · Helix",
};

export default function OperationsPage() {
  return (
    <RequireScope scope="incidents">
      <OperationsView />
    </RequireScope>
  );
}
