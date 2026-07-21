import type { ConfigItem } from "@/lib/backend";
import { SectionCard } from "./section-card";

type ConfigurationPanelProps = { config: readonly ConfigItem[] };

export function ConfigurationPanel({ config }: ConfigurationPanelProps) {
  return (
    <SectionCard title="Configuration">
      <dl className="grid grid-cols-1 gap-x-8 gap-y-0 sm:grid-cols-2">
        {config.map((c) => (
          <div
            key={c.label}
            className="border-border-token flex items-baseline justify-between gap-4 border-b py-2 last:border-0"
          >
            <dt className="text-text-3 text-[12px]">{c.label}</dt>
            <dd className="text-text-2 text-right text-[12.5px] font-medium">
              {c.value}
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
