import type { Metadata } from "next";
import { PoliciesView } from "@/features/policies";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Policies · Helix",
};

export default function PoliciesPage() {
  return (
    <RequireScope scope="policies">
      <PoliciesView />
    </RequireScope>
  );
}
