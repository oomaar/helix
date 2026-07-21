"use client";

import Link from "next/link";
import { BACKEND_NOW, type ResourceWithRelations } from "@/lib/backend";
import { money, relativeTime } from "@/lib/utils";
import { Sparkline } from "@/shared/charts";
import { CloseIcon } from "@/shared/icons";
import { Badge, Button, IconButton, StatusDot } from "@/shared/ui";
import { STATUS_TONE } from "../../constants";
import { cpuSeries } from "../../helpers";
import { Detail } from "./detail";
import { Section } from "./section";
import { Stat } from "./stat";

type ResourceDrawerContentProps = {
  resource: ResourceWithRelations;
  onClose: () => void;
};

export function ResourceDrawerContent({
  resource,
  onClose,
}: ResourceDrawerContentProps) {
  const series = cpuSeries(resource);
  const cpuColor =
    resource.cpu >= 85
      ? "var(--color-danger)"
      : resource.cpu >= 60
        ? "var(--color-warn)"
        : "var(--color-success)";

  return (
    <>
      <div className="border-border-token flex items-start gap-3 border-b px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2
            id="resource-drawer-title"
            className="text-text truncate text-[15px] font-semibold"
          >
            {resource.name}
          </h2>
          <p className="text-text-3 truncate font-mono text-[11px]">
            {resource.type} · {resource.id}
          </p>
        </div>
        <IconButton aria-label="Close preview" onClick={onClose}>
          <CloseIcon size={16} />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-2">
          <StatusDot tone={STATUS_TONE[resource.status]} />
          <span className="text-text-2 text-[12.5px] capitalize">
            {resource.status}
          </span>
          <span className="text-text-3">·</span>
          <span className="text-text-2 text-[12.5px]">
            {resource.providerAccount?.provider} · {resource.region}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Monthly cost" value={money(resource.monthlyCost)} />
          <div className="border-border-token rounded-lg border px-3 py-2">
            <div className="text-text-3 text-[10.5px] tracking-wide uppercase">
              CPU
            </div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-text font-mono text-[15px] font-bold">
                {resource.cpu}%
              </span>
              <Sparkline
                values={series}
                color={cpuColor}
                width={56}
                height={20}
              />
            </div>
          </div>
          <Stat label="Instances" value={String(resource.instances)} />
        </div>

        <Section title="Details">
          <Detail label="Owner" value={resource.owner?.name ?? "—"} />
          <Detail label="Team" value={resource.team?.name ?? "—"} />
          <Detail label="Environment" value={resource.environment} />
          <Detail label="Type" value={resource.kind} />
          <Detail label="Memory" value={`${resource.mem}%`} />
          <Detail
            label="Last change"
            value={relativeTime(resource.updatedAt, BACKEND_NOW)}
          />
        </Section>

        <Section title="Tags">
          <div className="col-span-2 flex flex-wrap gap-1.5">
            {resource.tags.length === 0 ? (
              <span className="text-text-3 text-[12px]">No tags</span>
            ) : (
              resource.tags.map((t) => (
                <Badge key={t.key} tone="neutral" mono={false}>
                  {t.key}:{t.value}
                </Badge>
              ))
            )}
          </div>
        </Section>

        {resource.status === "degraded" ? (
          <div className="bg-warn-soft text-warn rounded-lg px-3 py-2.5 text-[12px]">
            <span className="font-semibold">Active anomaly.</span> Elevated CPU
            with degraded health — review recent config changes and scaling.
          </div>
        ) : null}
      </div>

      <div className="border-border-token flex-none border-t px-5 py-3">
        <Link href={`/resources/${resource.id}`}>
          <Button variant="primary" fullWidth onClick={onClose}>
            Open full detail →
          </Button>
        </Link>
      </div>
    </>
  );
}
