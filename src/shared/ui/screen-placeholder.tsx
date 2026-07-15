import { PageHeader } from "@/shared/ui/page-header";

type ScreenPlaceholderProps = {
  title: string;
  description: string;
  phase?: string;
};

/**
 * Temporary content used by Phase 0 route stubs.
 * Replaced feature-by-feature in later phases.
 */
export function ScreenPlaceholder({
  title,
  description,
  phase = "Phase 1",
}: ScreenPlaceholderProps) {
  return (
    <div className="mx-auto max-w-[1400px] p-[22px_26px_60px]">
      <PageHeader title={title} description={description} />
      <div className="bg-surface-2 rounded-[var(--radius-panel)] border border-dashed border-[var(--color-border-strong)] p-8 text-center">
        <div className="text-text text-[13px] font-semibold">
          Screen coming in {phase}
        </div>
        <p className="text-text-3 mt-1 text-[12.5px]">
          Layout shell, navigation and design tokens are in place. This surface
          will be built with the full data grid, filters and workflows.
        </p>
      </div>
    </div>
  );
}
