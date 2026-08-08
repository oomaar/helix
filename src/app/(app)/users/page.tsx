import type { Metadata } from "next";
import { UsersView } from "@/features/users";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Users & Roles · Helix",
};

export default function UsersPage() {
  return (
    <RequireScope scope="users">
      <UsersView />
    </RequireScope>
  );
}
