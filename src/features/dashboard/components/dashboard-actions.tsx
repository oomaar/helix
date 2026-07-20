"use client";

import { printDocument } from "@/lib/utils";
import { DownloadIcon } from "@/shared/icons";
import { Button } from "@/shared/ui";

export function DashboardActions() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => printDocument("Helix — Cloud Operations Overview")}
    >
      <DownloadIcon size={14} />
      Export
    </Button>
  );
}
