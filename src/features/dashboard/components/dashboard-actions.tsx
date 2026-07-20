"use client";

import { printDocument } from "@/lib/utils";
import { DownloadIcon, PlusIcon } from "@/shared/icons";
import { Button } from "@/shared/ui";
import { useProvisioning } from "@/features/provisioning";

export function DashboardActions() {
  const provisioning = useProvisioning();

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => printDocument("Helix — Cloud Operations Overview")}
      >
        <DownloadIcon size={14} />
        Export
      </Button>
      <Button size="sm" variant="primary" onClick={provisioning.open}>
        <PlusIcon size={14} />
        Provision resource
      </Button>
    </>
  );
}
