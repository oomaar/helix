import type { ReactNode } from "react";
import { CheckIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";

type WizardConfirmationProps = {
  tone?: "success" | "warn";
  title: string;
  description: ReactNode;
  /** Badges / metadata under the description. */
  meta?: ReactNode;
  /** Next-step buttons. */
  actions: ReactNode;
};

/**
 * Terminal screen shown after a wizard submits. It replaces the whole panel so
 * the outcome — approved, queued, or awaiting approval — is unmissable.
 */
export function WizardConfirmation({
  tone = "success",
  title,
  description,
  meta,
  actions,
}: WizardConfirmationProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full",
          tone === "warn"
            ? "bg-warn-soft text-warn"
            : "bg-success-soft text-success",
        )}
      >
        <CheckIcon size={22} strokeWidth={2.4} />
      </div>
      <h2 className="text-text mt-3 text-[15px] font-semibold">{title}</h2>
      <div className="text-text-2 mt-1 max-w-md text-[12.5px]">
        {description}
      </div>
      {meta ? (
        <div className="mt-3 flex flex-wrap justify-center gap-2">{meta}</div>
      ) : null}
      <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>
    </div>
  );
}
