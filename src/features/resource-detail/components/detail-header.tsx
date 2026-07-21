"use client";

import Link from "next/link";
import type { ResourceWithRelations } from "@/lib/backend";
import { ChevronLeftIcon } from "@/shared/icons";
import { Badge, Button } from "@/shared/ui";
import { STATUS_TONE } from "../constants";

type DetailHeaderProps = {
  resource: ResourceWithRelations;
  busy: boolean;
  onRestart: () => void;
  onNote: (message: string) => void;
};

export function DetailHeader({
  resource,
  busy,
  onRestart,
  onNote,
}: DetailHeaderProps) {
  return (
    <div>
      <Link
        href="/resources"
        className="text-text-3 hover:text-text inline-flex items-center gap-1 text-[12px] font-medium"
      >
        <ChevronLeftIcon size={13} />
        Resources
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-text truncate text-[20px] font-bold tracking-tight">
              {resource.name}
            </h1>
            <Badge tone={STATUS_TONE[resource.status]} className="capitalize">
              {resource.status}
            </Badge>
          </div>
          <p className="text-text-3 mt-0.5 font-mono text-[12px]">
            {resource.type} · {resource.providerAccount?.provider} ·{" "}
            {resource.region} · {resource.id}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            disabled={busy}
            onClick={onRestart}
          >
            {busy ? "Restarting…" : "Restart"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNote("Edit config isn’t available in this demo.")}
          >
            Edit config
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNote("Optimization recommendations queued.")}
          >
            Optimize
          </Button>
        </div>
      </div>
    </div>
  );
}
