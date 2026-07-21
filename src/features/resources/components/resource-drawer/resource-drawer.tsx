"use client";

import type { ResourceWithRelations } from "@/lib/backend";
import { Drawer } from "@/shared/ui";
import { ResourceDrawerContent } from "./resource-drawer-content";

type ResourceDrawerProps = {
  resource: ResourceWithRelations | null;
  onClose: () => void;
};

export function ResourceDrawer({ resource, onClose }: ResourceDrawerProps) {
  return (
    <Drawer
      open={Boolean(resource)}
      onClose={onClose}
      labelledBy="resource-drawer-title"
    >
      {resource ? (
        <ResourceDrawerContent resource={resource} onClose={onClose} />
      ) : null}
    </Drawer>
  );
}
