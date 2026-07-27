import Link from "next/link";
import type { LinkedEntity } from "@/lib/backend";
import { Card, CardBody, CardHeader, CardTitle } from "@/shared/ui";

type LinkedEntitiesProps = { linked: readonly LinkedEntity[] };

function Row({ entity }: { entity: LinkedEntity }) {
  return (
    <>
      <span className="text-text-3 flex-none text-[10.5px] font-medium tracking-wide uppercase">
        {entity.kind}
      </span>
      <span className="text-text truncate text-[12.5px] font-medium">
        {entity.label}
      </span>
    </>
  );
}

export function LinkedEntities({ linked }: LinkedEntitiesProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>Linked entities</CardTitle>
      </CardHeader>
      <CardBody>
        <ul className="-mx-2 space-y-0.5">
          {linked.map((entity) =>
            entity.href ? (
              <li key={entity.kind}>
                <Link
                  href={entity.href}
                  className="hover:bg-hover flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
                >
                  <Row entity={entity} />
                  <span className="text-text-3 ml-auto flex-none">→</span>
                </Link>
              </li>
            ) : (
              <li
                key={entity.kind}
                className="flex items-center gap-3 px-2 py-2"
              >
                <Row entity={entity} />
              </li>
            ),
          )}
        </ul>
      </CardBody>
    </Card>
  );
}
