import type { Metadata } from "next";
import { FlagsView } from "@/features/flags";
import { RequireScope } from "@/shared/session";

export const metadata: Metadata = {
  title: "Feature Flags · Helix",
};

export default function FlagsPage() {
  return (
    <RequireScope scope="flags">
      <FlagsView />
    </RequireScope>
  );
}
