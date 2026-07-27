"use client";

import {
  BACKEND_NOW,
  type Environment,
  type FeatureFlagWithOwner,
  type FlagPatch,
  type FlagRollout,
} from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import { Avatar, Badge, Card, Chip, RadioGroup } from "@/shared/ui";
import { ENVIRONMENTS, ROLLOUT_OPTIONS, ROLLOUT_TONE } from "../constants";

type FlagCardProps = {
  flag: FeatureFlagWithOwner;
  onPatch: (id: string, patch: FlagPatch) => void;
};

export function FlagCard({ flag, onPatch }: FlagCardProps) {
  const toggleEnv = (env: Environment) => {
    const set = new Set(flag.environments);
    if (set.has(env)) set.delete(env);
    else set.add(env);
    onPatch(flag.id, { environments: [...set] });
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-text text-[13.5px] font-semibold">
              {flag.name}
            </span>
            <Badge tone={ROLLOUT_TONE[flag.rollout]} className="capitalize">
              {flag.rollout === "percentage"
                ? `${flag.percentage}%`
                : flag.rollout}
            </Badge>
          </div>
          <div className="text-text-3 font-mono text-[11px]">{flag.key}</div>
        </div>
      </div>

      <p className="text-text-2 mt-2 text-[12.5px]">{flag.description}</p>

      <div className="mt-3 space-y-3">
        <div>
          <div className="text-text-3 mb-1.5 text-[10.5px] font-semibold tracking-wide uppercase">
            Rollout
          </div>
          <RadioGroup
            ariaLabel={`Rollout for ${flag.name}`}
            value={flag.rollout}
            options={[...ROLLOUT_OPTIONS]}
            onChange={(v) => onPatch(flag.id, { rollout: v as FlagRollout })}
          />
        </div>

        {flag.rollout === "percentage" ? (
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-text-3 text-[10.5px] font-semibold tracking-wide uppercase">
                Rollout percentage
              </span>
              <span className="text-text font-mono text-[12px] font-semibold">
                {flag.percentage}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={flag.percentage}
              onChange={(e) =>
                onPatch(flag.id, { percentage: Number(e.target.value) })
              }
              className="accent-brand w-full"
              aria-label={`Rollout percentage for ${flag.name}`}
            />
          </div>
        ) : null}

        <div>
          <div className="text-text-3 mb-1.5 text-[10.5px] font-semibold tracking-wide uppercase">
            Target environments
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ENVIRONMENTS.map((env) => (
              <Chip
                key={env.value}
                active={flag.environments.includes(env.value)}
                onClick={() => toggleEnv(env.value)}
              >
                {env.label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="border-border-token text-text-3 mt-3 flex items-center gap-2 border-t pt-2.5 text-[11px]">
        {flag.owner ? <Avatar name={flag.owner.name} size={24} /> : null}
        <span className="truncate">{flag.owner?.name ?? "Unassigned"}</span>
        <span className="ml-auto">
          updated {relativeTime(flag.updatedAt, BACKEND_NOW)}
        </span>
      </div>
    </Card>
  );
}
