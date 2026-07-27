import { InvestigationView } from "@/features/investigation";

export default async function InvestigationDetailPage(
  props: PageProps<"/investigations/[id]">,
) {
  const { id } = await props.params;
  return <InvestigationView id={id} />;
}
