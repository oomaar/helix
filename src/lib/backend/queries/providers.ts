import type { ProviderAccount } from "../models";
import { request } from "../client";
import { getDatabase } from "../store";

export async function listProviders(): Promise<readonly ProviderAccount[]> {
  return request(() => getDatabase().providers);
}

export async function getProvider(id: string): Promise<ProviderAccount | null> {
  return request(
    () => getDatabase().providers.find((p) => p.id === id) ?? null,
  );
}
