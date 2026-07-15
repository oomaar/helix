import { ScreenPlaceholder } from "@/shared/ui/screen-placeholder";

export default async function ResourceDetailPage(
  props: PageProps<"/resources/[id]">,
) {
  const { id } = await props.params;
  return (
    <ScreenPlaceholder
      title={`Resource ${id}`}
      description="Overview, metrics, activity, permissions and attachments."
    />
  );
}
