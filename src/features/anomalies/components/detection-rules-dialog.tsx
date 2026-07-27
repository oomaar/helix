"use client";

import { useState } from "react";
import { listDetectionRules } from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { Badge, Dialog, Skeleton, Switch } from "@/shared/ui";
import { SENSITIVITY_TONE } from "../constants";

type DetectionRulesDialogProps = { open: boolean; onClose: () => void };

export function DetectionRulesDialog({
  open,
  onClose,
}: DetectionRulesDialogProps) {
  const rules = useAsync(() => listDetectionRules(), []);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  if (!open) return null;

  return (
    <Dialog
      open
      onClose={onClose}
      align="center"
      labelledBy="rules-title"
      className="max-w-lg"
    >
      <div className="border-border-token border-b px-5 py-3.5">
        <h2 id="rules-title" className="text-text text-[15px] font-semibold">
          Detection rules
        </h2>
        <p className="text-text-3 text-[12px]">
          ML + heuristic rules that flag spend deviations.
        </p>
      </div>

      <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5 py-4">
        {rules.loading && !rules.data
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))
          : rules.data?.map((rule) => {
              const enabled = overrides[rule.id] ?? rule.enabled;
              return (
                <div
                  key={rule.id}
                  className="border-border-token flex items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-text text-[12.5px] font-medium">
                        {rule.name}
                      </span>
                      <Badge tone={SENSITIVITY_TONE[rule.sensitivity]}>
                        {rule.sensitivity}
                      </Badge>
                    </div>
                    <div className="text-text-3 mt-0.5 font-mono text-[11px]">
                      {rule.condition}
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onChange={(v) =>
                      setOverrides((o) => ({ ...o, [rule.id]: v }))
                    }
                  />
                </div>
              );
            })}
      </div>
    </Dialog>
  );
}
