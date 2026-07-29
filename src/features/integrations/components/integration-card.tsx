"use client";

import type { Integration } from "@/lib/backend";
import { Badge, Button, Card, StatusDot } from "@/shared/ui";
import { CATEGORY_TONE } from "../constants";

type IntegrationCardProps = {
  integration: Integration;
  busy: boolean;
  onToggle: (integration: Integration) => void;
};

export function IntegrationCard({
  integration,
  busy,
  onToggle,
}: IntegrationCardProps) {
  const { connected } = integration;
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text truncate text-[13px] font-semibold">
              {integration.name}
            </span>
            <Badge tone={CATEGORY_TONE[integration.category]}>
              {integration.category}
            </Badge>
          </div>
        </div>
        {connected ? (
          <span className="text-success inline-flex flex-none items-center gap-1.5 text-[11px] font-medium">
            <StatusDot tone="success" />
            Connected
          </span>
        ) : null}
      </div>

      <p className="text-text-2 mt-2 flex-1 text-[12.5px]">
        {integration.description}
      </p>

      <Button
        size="sm"
        variant={connected ? "secondary" : "primary"}
        fullWidth
        className="mt-3"
        disabled={busy}
        onClick={() => onToggle(integration)}
      >
        {busy ? "…" : connected ? "Disconnect" : "Connect"}
      </Button>
    </Card>
  );
}
