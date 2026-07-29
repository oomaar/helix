"use client";

import type { CloudAccount } from "@/lib/backend";
import { money, numberCompact, shortDate } from "@/lib/utils";
import { Badge, Button, Card, StatusDot } from "@/shared/ui";
import { PROVIDER_TONE } from "../constants";

type CloudAccountCardProps = {
  account: CloudAccount;
  onManage: (account: CloudAccount) => void;
};

export function CloudAccountCard({ account, onManage }: CloudAccountCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone={PROVIDER_TONE[account.provider]}>
              {account.provider}
            </Badge>
            <span className="text-text truncate text-[13px] font-semibold">
              {account.displayName}
            </span>
          </div>
          <div className="text-text-3 mt-0.5 font-mono text-[11px]">
            {account.accountId}
          </div>
        </div>
        <span className="text-success inline-flex flex-none items-center gap-1.5 text-[11px] font-medium">
          <StatusDot tone="success" />
          Connected
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2">
        {[
          ["Resources", numberCompact(account.resourceCount)],
          ["Spend/mo", money(account.monthlyCost)],
          ["Regions", String(account.regions.length)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-text-3 text-[10.5px] tracking-wide uppercase">
              {label}
            </dt>
            <dd className="text-text font-mono text-[13px] font-semibold">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border-border-token mt-3 flex items-center gap-2 border-t pt-2.5">
        <span className="text-text-3 truncate text-[11px]">
          {account.regions.join(", ")}
        </span>
        <span className="text-text-3 ml-auto flex-none text-[11px]">
          since {shortDate(account.connectedAt)}
        </span>
      </div>

      <Button
        size="sm"
        variant="secondary"
        fullWidth
        className="mt-3"
        onClick={() => onManage(account)}
      >
        Manage
      </Button>
    </Card>
  );
}
