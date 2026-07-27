import type { InvestigationSignal } from "@/lib/backend";
import { cn } from "@/lib/utils";
import { Card } from "@/shared/ui";

type SignalStatsProps = { signals: readonly InvestigationSignal[] };

const TONE_CLASS: Record<InvestigationSignal["tone"], string> = {
  danger: "text-danger",
  warn: "text-warn",
  neutral: "text-text-2",
};

export function SignalStats({ signals }: SignalStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {signals.map((s) => (
        <Card key={s.label} className="px-4 py-3.5">
          <div className="text-text-3 text-[11px] font-medium">{s.label}</div>
          <div className="text-text mt-1 text-[22px] leading-none font-bold tracking-tight">
            {s.value}
          </div>
          <div
            className={cn("mt-1 text-[11px] font-semibold", TONE_CLASS[s.tone])}
          >
            {s.hint}
          </div>
        </Card>
      ))}
    </div>
  );
}
