import { InvestigationView } from "@/features/investigation";
import { RequireScope } from "@/shared/session";

export default async function InvestigationDetailPage(
  props: PageProps<"/investigations/[id]">,
) {
  const { id } = await props.params;
  return (
    <RequireScope scope="incidents">
      <InvestigationView id={id} />
    </RequireScope>
  );
}
