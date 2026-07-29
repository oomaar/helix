import type { ReactNode } from "react";
import { Card } from "@/shared/ui";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <Card as="section" className="p-4.5">
      <div className="mb-3.5">
        <h2 className="text-text text-[14px] font-semibold">{title}</h2>
        {description ? (
          <p className="text-text-3 mt-0.5 text-[12px]">{description}</p>
        ) : null}
      </div>
      {children}
    </Card>
  );
}
