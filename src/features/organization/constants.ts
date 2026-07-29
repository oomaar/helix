import type { Environment, Region } from "@/lib/backend";
import type { SelectOption } from "@/shared/ui";

export const ENVIRONMENT_OPTIONS: readonly {
  value: Environment;
  label: string;
}[] = [
  { value: "production", label: "Production" },
  { value: "staging", label: "Staging" },
  { value: "development", label: "Development" },
];

export const REGION_OPTIONS: readonly { value: Region; label: string }[] = [
  { value: "us-east-1", label: "us-east-1" },
  { value: "us-west-2", label: "us-west-2" },
  { value: "eu-west-1", label: "eu-west-1" },
  { value: "eu-central-1", label: "eu-central-1" },
  { value: "ap-southeast-1", label: "ap-southeast-1" },
];

export const CURRENCY_OPTIONS: readonly SelectOption[] = [
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
  { value: "GBP", label: "GBP (£)" },
];

export const TIMEZONE_OPTIONS: readonly SelectOption[] = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "US · Eastern" },
  { value: "America/Los_Angeles", label: "US · Pacific" },
  { value: "Europe/London", label: "Europe · London" },
];

export const SESSION_TIMEOUT_OPTIONS: readonly SelectOption[] = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "480", label: "8 hours" },
];
