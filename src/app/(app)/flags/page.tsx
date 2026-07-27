import type { Metadata } from "next";
import { FlagsView } from "@/features/flags";

export const metadata: Metadata = {
  title: "Feature Flags · Helix",
};

export default function FlagsPage() {
  return <FlagsView />;
}
