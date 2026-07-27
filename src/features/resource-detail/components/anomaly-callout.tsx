import Link from "next/link";
import type { ResourceAnomaly } from "@/lib/backend";

type AnomalyCalloutProps = { anomaly: ResourceAnomaly };

export function AnomalyCallout({ anomaly }: AnomalyCalloutProps) {
  return (
    <div className="bg-warn-soft border-warn/30 rounded-panel border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-warn text-[10.5px] font-semibold tracking-wide uppercase">
            Active anomaly · {anomaly.id}
          </div>
          <div className="text-text mt-1 text-[13.5px] font-semibold">
            {anomaly.title}
          </div>
          <p className="text-text-2 mt-1 text-[12.5px]">{anomaly.summary}</p>
        </div>
        <Link
          href={anomaly.href}
          className="bg-warn/15 text-warn hover:bg-warn/25 flex-none rounded-md px-3 py-1.5 text-[12px] font-semibold whitespace-nowrap transition-colors"
        >
          Investigate →
        </Link>
      </div>
    </div>
  );
}
