import { ResourceDetailView } from "@/features/resource-detail";

export default async function ResourceDetailPage(
  props: PageProps<"/resources/[id]">,
) {
  const { id } = await props.params;
  return <ResourceDetailView id={id} />;
}
