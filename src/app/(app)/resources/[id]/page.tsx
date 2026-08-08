import { ResourceDetailView } from "@/features/resource-detail";
import { RequireScope } from "@/shared/session";

export default async function ResourceDetailPage(
  props: PageProps<"/resources/[id]">,
) {
  const { id } = await props.params;
  return (
    <RequireScope scope="resources">
      <ResourceDetailView id={id} />
    </RequireScope>
  );
}
