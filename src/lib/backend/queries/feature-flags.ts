import type { Environment, FeatureFlag, FlagRollout, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";
import { BACKEND_NOW } from "./metrics";

export type FeatureFlagWithOwner = FeatureFlag & { owner: User | null };

function withOwner(f: FeatureFlag): FeatureFlagWithOwner {
  return {
    ...f,
    owner: getDatabase().users.find((u) => u.id === f.ownerId) ?? null,
  };
}

export async function listFeatureFlags(): Promise<
  readonly FeatureFlagWithOwner[]
> {
  return request(() => getDatabase().featureFlags.map(withOwner));
}

export type FlagsSummary = { total: number; active: number };

export async function getFlagsSummary(): Promise<FlagsSummary> {
  return request(() => {
    const flags = getDatabase().featureFlags;
    return {
      total: flags.length,
      active: flags.filter((f) => f.rollout !== "off").length,
    };
  });
}

type MutableFlag = { -readonly [K in keyof FeatureFlag]: FeatureFlag[K] };

export type FlagPatch = {
  rollout?: FlagRollout;
  percentage?: number;
  environments?: readonly Environment[];
};

export async function updateFlag(
  id: string,
  patch: FlagPatch,
): Promise<FeatureFlagWithOwner | null> {
  return request(() => {
    const flag = getDatabase().featureFlags.find((f) => f.id === id);
    if (!flag) return null;
    const m = flag as MutableFlag;
    if (patch.rollout !== undefined) m.rollout = patch.rollout;
    if (patch.percentage !== undefined) {
      m.percentage = Math.max(0, Math.min(100, Math.round(patch.percentage)));
    }
    if (patch.environments !== undefined) m.environments = patch.environments;
    m.updatedAt = BACKEND_NOW.toISOString();
    return withOwner(flag);
  });
}
