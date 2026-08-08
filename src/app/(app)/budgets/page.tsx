import type { Metadata } from "next";
import { BudgetsView } from "@/features/budgets";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Budgets · Helix",
};

export default function BudgetsPage() {
  return (
    <RequireScope scope="budgets">
      <BudgetsView />
    </RequireScope>
  );
}
