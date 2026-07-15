import type { FeatureFlag, User } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export type FeatureFlagWithOwner = FeatureFlag & { owner: User | null };

export async function listFeatureFlags(): Promise<
  readonly FeatureFlagWithOwner[]
> {
  return request(() => {
    const { featureFlags, users } = getDatabase();
    return featureFlags.map((f) => ({
      ...f,
      owner: users.find((u) => u.id === f.ownerId) ?? null,
    }));
  });
}
