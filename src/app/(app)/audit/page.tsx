import type { Metadata } from "next";
import { AuditView } from "@/features/audit";

export const metadata: Metadata = {
  title: "Audit Log · Helix",
};

export default function AuditPage() {
  return <AuditView />;
}
