import type {
  Environment,
  Provider,
  Region,
  ResourceKind,
} from "@/lib/backend";
import type { SelectOption } from "@/shared/ui";

/**
 * Select/chip options for the domain enums.
 *
 * One source rather than a copy per feature: these lists mirror union types in
 * the backend model, so a value added there has exactly one place to be
 * reflected in the UI. Feature-specific option sets (severities, enforcement
 * modes) stay in their own feature.
 */

export const ENVIRONMENT_OPTIONS: readonly SelectOption[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
] satisfies readonly { value: Environment; label: string }[];

export const PROVIDER_OPTIONS: readonly SelectOption[] = [
  { value: "AWS", label: "AWS" },
  { value: "Azure", label: "Azure" },
  { value: "GCP", label: "GCP" },
] satisfies readonly { value: Provider; label: string }[];

export const REGION_OPTIONS: readonly SelectOption[] = [
  { value: "us-east-1", label: "us-east-1" },
  { value: "us-west-2", label: "us-west-2" },
  { value: "eu-west-1", label: "eu-west-1" },
  { value: "eu-central-1", label: "eu-central-1" },
  { value: "ap-southeast-1", label: "ap-southeast-1" },
] satisfies readonly { value: Region; label: string }[];

export const RESOURCE_KIND_OPTIONS: readonly SelectOption[] = [
  { value: "compute", label: "Compute" },
  { value: "database", label: "Database" },
  { value: "storage", label: "Storage" },
  { value: "network", label: "Network" },
  { value: "cache", label: "Cache" },
  { value: "queue", label: "Queue" },
  { value: "cluster", label: "Cluster" },
] satisfies readonly { value: ResourceKind; label: string }[];
