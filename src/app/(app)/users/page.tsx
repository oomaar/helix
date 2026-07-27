import type { Metadata } from "next";
import { UsersView } from "@/features/users";

export const metadata: Metadata = {
  title: "Users & Roles · Helix",
};

export default function UsersPage() {
  return <UsersView />;
}
