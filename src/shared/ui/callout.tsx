import type { ReactNode } from "react";
import { AnomaliesIcon, CheckIcon, InfoIcon } from "@/shared/icons";
import { cn } from "@/lib/utils";

export type CalloutTone = "info" | "warn" | "danger" | "success" | "brand";

type CalloutProps = {
  tone?: CalloutTone;
  title?: ReactNode;
  children?: ReactNode;
  /** Right-aligned slot for a value, badge or action. */
  trailing?: ReactNode;
  className?: string;
};

const TONES: Record<CalloutTone, { box: string; icon: string }> = {
  info: {
    box: "bg-info-soft border-[color-mix(in_srgb,var(--color-info)_35%,transparent)]",
    icon: "text-info",
  },
  warn: {
    box: "bg-warn-soft border-[color-mix(in_srgb,var(--color-warn)_45%,transparent)]",
    icon: "text-warn",
  },
  danger: {
    box: "bg-danger-soft border-[color-mix(in_srgb,var(--color-danger)_40%,transparent)]",
    icon: "text-danger",
  },
  success: {
    box: "bg-success-soft border-[color-mix(in_srgb,var(--color-success)_35%,transparent)]",
    icon: "text-success",
  },
  brand: {
    box: "bg-brand-soft border-brand-line",
    icon: "text-brand",
  },
};

const ICONS: Record<CalloutTone, typeof InfoIcon> = {
  info: InfoIcon,
  warn: AnomaliesIcon,
  danger: AnomaliesIcon,
  success: CheckIcon,
  brand: InfoIcon,
};

/**
 * Inline advisory block used by forms and wizards to explain consequences
 * (approval required, enforcement impact, cost implications).
 */
export function Callout({
  tone = "info",
  title,
  children,
  trailing,
  className,
}: CalloutProps) {
  const styles = TONES[tone];
  const Icon = ICONS[tone];
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-[9px] border px-3 py-2.5",
        styles.box,
        className,
      )}
    >
      <Icon size={15} className={cn("mt-px flex-none", styles.icon)} />
      <div className="min-w-0 flex-1">
        {title ? (
          <div className="text-text text-[12.5px] font-semibold">{title}</div>
        ) : null}
        {children ? (
          <div className={cn("text-text-2 text-[12px]", title ? "mt-0.5" : "")}>
            {children}
          </div>
        ) : null}
      </div>
      {trailing ? <div className="flex-none">{trailing}</div> : null}
    </div>
  );
}
