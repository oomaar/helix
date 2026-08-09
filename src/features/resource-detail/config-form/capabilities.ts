import type { ResourceKind } from "@/lib/backend";
import type { SelectOption } from "@/shared/ui";

import { ENVIRONMENT_OPTIONS } from "@/shared/lib/domain-options";

export { ENVIRONMENT_OPTIONS };

/**
 * Which configuration sections apply to which resource kind.
 *
 * Rendering a "Backup retention" field on a queue would be noise, so the form
 * asks this table what to show. Adding a kind means adding one row here — not
 * touching the form.
 */
export type ConfigCapabilities = {
  sizing: boolean;
  autoscaling: boolean;
  availability: boolean;
  storage: boolean;
  backups: boolean;
  networkAccess: boolean;
};

const NONE: ConfigCapabilities = {
  sizing: true,
  autoscaling: false,
  availability: false,
  storage: false,
  backups: false,
  networkAccess: false,
};

export const CAPABILITIES: Readonly<Record<ResourceKind, ConfigCapabilities>> =
  {
    compute: { ...NONE, autoscaling: true, networkAccess: true },
    cluster: { ...NONE, autoscaling: true, availability: true },
    database: {
      ...NONE,
      availability: true,
      storage: true,
      backups: true,
      networkAccess: true,
    },
    cache: { ...NONE, availability: true },
    storage: { ...NONE, sizing: false, storage: true, networkAccess: true },
    network: { ...NONE, networkAccess: true },
    queue: { ...NONE, sizing: false },
  };

export function capabilitiesFor(kind: ResourceKind): ConfigCapabilities {
  return CAPABILITIES[kind];
}

/** Instance types offered per kind, so the form never suggests nonsense. */
export const INSTANCE_TYPES: Readonly<Record<ResourceKind, readonly string[]>> =
  {
    compute: ["m6i.large", "m6i.xlarge", "m6i.2xlarge", "c7g.xlarge"],
    database: [
      "db.r6g.large",
      "db.r6g.xlarge",
      "db.r6g.2xlarge",
      "postgres-13-large",
    ],
    cache: ["cache.r7g.large", "cache.r7g.xlarge", "redis-cluster-m"],
    cluster: ["eks-1.29", "aks-1.28", "gke-1.29"],
    storage: ["gp3-500gb", "premium-ssd-1tb", "standard-hdd-2tb"],
    network: ["vpc-nat", "load-balancer-app", "cdn-edge"],
    queue: ["sqs-standard", "servicebus-queue", "pubsub-topic"],
  };

/**
 * The current type is always offered even when it isn't in the catalogue, so
 * opening the form never silently rewrites a resource's type.
 */
export function instanceTypeOptions(
  kind: ResourceKind,
  current: string,
): readonly SelectOption[] {
  const catalogue = INSTANCE_TYPES[kind];
  const values = catalogue.includes(current)
    ? catalogue
    : [current, ...catalogue];
  return values.map((value) => ({ value, label: value }));
}

export const MAINTENANCE_WINDOW_OPTIONS: readonly SelectOption[] = [
  { value: "sun:03:00-04:00 UTC", label: "Sunday 03:00–04:00 UTC" },
  { value: "sat:02:00-03:00 UTC", label: "Saturday 02:00–03:00 UTC" },
  { value: "wed:04:00-05:00 UTC", label: "Wednesday 04:00–05:00 UTC" },
];

export const RETENTION_OPTIONS: readonly SelectOption[] = [
  { value: "1", label: "1 day" },
  { value: "3", label: "3 days" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "35", label: "35 days" },
];
