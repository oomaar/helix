import type { RemediationStep } from "@/lib/backend";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { RISK_TONE } from "../constants";

type RemediationRunbookProps = {
  name: string;
  steps: readonly RemediationStep[];
  executed: ReadonlySet<string>;
  onExecute: (step: RemediationStep) => void;
};

export function RemediationRunbook({
  name,
  steps,
  executed,
  onExecute,
}: RemediationRunbookProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Remediation runbook</CardTitle>
        <span className="text-text-3 ml-auto font-mono text-[11px]">
          {name}
        </span>
      </CardHeader>
      <CardBody>
        <ul className="space-y-2">
          {steps.map((step) => {
            const done = executed.has(step.id);
            return (
              <li
                key={step.id}
                className="border-border-token flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <Badge
                  tone={RISK_TONE[step.risk]}
                  className="flex-none capitalize"
                >
                  {step.risk}
                </Badge>
                <span className="text-text-2 min-w-0 flex-1 text-[12.5px]">
                  {step.title}
                </span>
                <Button
                  size="sm"
                  variant={done ? "secondary" : "primary"}
                  disabled={done}
                  onClick={() => onExecute(step)}
                >
                  {done ? "Executed" : "Execute"}
                </Button>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
