import type { Metadata } from "next";
import { BudgetsView } from "@/features/budgets";

export const metadata: Metadata = {
  title: "Budgets · Helix",
};

export default function BudgetsPage() {
  return <BudgetsView />;
}
