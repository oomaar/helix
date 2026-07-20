import type { Environment, Provider, Region } from "@/lib/backend";
import type { SelectOption } from "@/shared/ui";

export const STEPS = [
  "Basics",
  "Configuration",
  "Access & tags",
  "Review",
] as const;
export type StepIndex = 0 | 1 | 2 | 3;

export const PROVIDERS: readonly Provider[] = ["AWS", "Azure", "GCP"];

export const ENVIRONMENTS: readonly { value: Environment; label: string }[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export const REGIONS: readonly Region[] = [
  "us-east-1",
  "us-west-2",
  "eu-west-1",
  "eu-central-1",
  "ap-southeast-1",
];

/**
 * Resource types drive the conditional Configuration step: each declares its
 * own instance classes and which options apply.
 */
export type ResourceTypeDef = {
  value: string;
  label: string;
  instanceClasses: readonly string[];
  storage: boolean;
  multiAz: boolean;
  perfInsights: boolean;
};

export const RESOURCE_TYPES: readonly ResourceTypeDef[] = [
  {
    value: "rds-postgres",
    label: "RDS PostgreSQL (read replica)",
    instanceClasses: ["db.r6g.xlarge", "db.r6g.2xlarge", "db.r6g.4xlarge"],
    storage: true,
    multiAz: true,
    perfInsights: true,
  },
  {
    value: "ec2-asg",
    label: "EC2 Auto Scaling Group",
    instanceClasses: ["m6i.large", "m6i.xlarge", "m6i.2xlarge"],
    storage: false,
    multiAz: false,
    perfInsights: false,
  },
  {
    value: "elasticache-redis",
    label: "ElastiCache Redis",
    instanceClasses: ["cache.r7g.large", "cache.r7g.xlarge"],
    storage: false,
    multiAz: true,
    perfInsights: false,
  },
  {
    value: "opensearch",
    label: "OpenSearch cluster",
    instanceClasses: ["or1.large", "or1.xlarge"],
    storage: true,
    multiAz: true,
    perfInsights: false,
  },
];

/** Monthly base cost (USD) per instance class, used by the live estimate. */
export const INSTANCE_BASE_COST: Readonly<Record<string, number>> = {
  "db.r6g.xlarge": 6000,
  "db.r6g.2xlarge": 12000,
  "db.r6g.4xlarge": 24000,
  "m6i.large": 2200,
  "m6i.xlarge": 4400,
  "m6i.2xlarge": 8800,
  "cache.r7g.large": 3200,
  "cache.r7g.xlarge": 6400,
  "or1.large": 5200,
  "or1.xlarge": 10400,
};

export const STORAGE_COST_PER_GB = 0.12;
export const MULTI_AZ_MULTIPLIER = 0.6;
export const PERF_INSIGHTS_COST = 900;

/** Roles that can be granted access to the new resource. */
export const ROLE_OPTIONS: readonly SelectOption[] = [
  { value: "commerce-editors", label: "Commerce · Editors" },
  { value: "platform-admins", label: "Platform Ops · Admins" },
  { value: "data-editors", label: "Data Platform · Editors" },
  { value: "security-viewers", label: "Security · Viewers" },
  { value: "sre-oncall", label: "SRE · On-call" },
];

export function resourceTypeDef(value: string): ResourceTypeDef | undefined {
  return RESOURCE_TYPES.find((t) => t.value === value);
}
