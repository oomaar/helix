import type { Metadata } from "next";
import { AuditView } from "@/features/audit";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Audit Log · Helix",
};

export default function AuditPage() {
  return (
    <RequireScope scope="audit">
      <AuditView />
    </RequireScope>
  );
}
