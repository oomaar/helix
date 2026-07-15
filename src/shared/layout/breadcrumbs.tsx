"use client";

import { usePathname } from "next/navigation";
import { resolveCrumb } from "@/shared/nav/nav-config";

export function Breadcrumbs() {
  const pathname = usePathname();
  const [group, page] = resolveCrumb(pathname);

  return (
    <nav
      className="flex min-w-0 items-center gap-[7px] text-[12.5px]"
      aria-label="Breadcrumb"
    >
      <span className="text-text-3">Helix</span>
      <span className="text-text-3">/</span>
      <span className="text-text-3">{group}</span>
      <span className="text-text-3">/</span>
      <span className="text-text truncate font-semibold">{page}</span>
    </nav>
  );
}
