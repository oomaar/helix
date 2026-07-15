import { ScreenPlaceholder } from "@/shared/ui/screen-placeholder";

export default async function InvestigationDetailPage(
  props: PageProps<"/investigations/[id]">,
) {
  const { id } = await props.params;
  return (
    <ScreenPlaceholder
      title={`Investigation ${id}`}
      description="Timeline, signals, correlations, config diff and runbook."
    />
  );
}
