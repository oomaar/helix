import type { WizardStepDef } from "@/shared/forms";
import {
  validateAccess,
  validateBasics,
  validateConfiguration,
} from "./helpers";
import type { ProvisionDraft } from "./types";

/** Step contract for the provisioning wizard, consumed by `useWizard`. */
export const PROVISION_STEPS: readonly WizardStepDef<ProvisionDraft>[] = [
  {
    id: "basics",
    label: "Basics",
    description: "Name, provider and resource type",
    validate: validateBasics,
  },
  {
    id: "configuration",
    label: "Configuration",
    description: "Sizing, region and options",
    validate: validateConfiguration,
  },
  {
    id: "access",
    label: "Access & tags",
    description: "Ownership and chargeback",
    validate: validateAccess,
  },
  {
    id: "review",
    label: "Review",
    description: "Confirm and submit",
  },
];
