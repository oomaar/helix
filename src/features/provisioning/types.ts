import type { Environment, Provider, Region } from "@/lib/backend";

export type TagPair = { id: string; key: string; value: string };

/** Working draft held by the wizard across all four steps. */
export type ProvisionDraft = {
  name: string;
  provider: Provider;
  environment: Environment;
  resourceType: string;
  instanceClass: string;
  region: Region;
  storageGb: number;
  multiAz: boolean;
  encryption: boolean;
  perfInsights: boolean;
  teamId: string;
  roles: string[];
  tags: TagPair[];
};

export type StepErrors = Readonly<Record<string, string>>;

export type StepProps = {
  draft: ProvisionDraft;
  set: (patch: Partial<ProvisionDraft>) => void;
  errors: StepErrors;
};
