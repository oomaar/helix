"use client";

import Link from "next/link";
import { BACKEND_NOW, type Investigation } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import { ChevronLeftIcon } from "@/shared/icons";
import { Badge, Button } from "@/shared/ui";
import { SEVERITY_TONE } from "../constants";

type InvestigationHeaderProps = {
  investigation: Investigation;
  busy: boolean;
  onResolve: () => void;
  onNote: (message: string) => void;
};

export function InvestigationHeader({
  investigation,
  busy,
  onResolve,
  onNote,
}: InvestigationHeaderProps) {
  const resolved = investigation.status === "resolved";
  return (
    <div>
      <Link
        href="/operations"
        className="text-text-3 hover:text-text inline-flex items-center gap-1 text-[12px] font-medium"
      >
        <ChevronLeftIcon size={13} />
        Operations
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-text text-[20px] font-bold tracking-tight">
              {investigation.title}
            </h1>
            <Badge tone={SEVERITY_TONE[investigation.severity]}>
              {investigation.severity.toUpperCase()}
            </Badge>
            <Badge
              tone={resolved ? "success" : "neutral"}
              className="capitalize"
            >
              {investigation.status}
            </Badge>
          </div>
          <p className="text-text-2 mt-1 max-w-2xl text-[12.5px]">
            {investigation.summary}
          </p>
          <p className="text-text-3 mt-0.5 text-[11px]">
            {investigation.id} · on-call {investigation.ownerName} · detected{" "}
            {relativeTime(investigation.detectedAt, BACKEND_NOW)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNote("Incident escalated to SEV lead.")}
          >
            Escalate
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onNote("War-room link copied.")}
          >
            Share
          </Button>
          <Button
            size="sm"
            variant="primary"
            disabled={busy || resolved}
            onClick={onResolve}
          >
            {resolved ? "Resolved" : busy ? "Resolving…" : "Declare resolved"}
          </Button>
        </div>
      </div>
    </div>
  );
}
