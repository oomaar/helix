"use client";

import { ChevronDownIcon } from "@/shared/icons";
import {
  Button,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Popover,
} from "@/shared/ui";
import type { SavedView } from "../saved-views";

type SavedViewsMenuProps = {
  presets: readonly SavedView[];
  saved: readonly SavedView[];
  onLoad: (view: SavedView) => void;
};

export function SavedViewsMenu({
  presets,
  saved,
  onLoad,
}: SavedViewsMenuProps) {
  return (
    <Popover
      label="Saved views"
      align="start"
      panelClassName="w-56"
      button={({ toggle, open }) => (
        <Button size="sm" variant="ghost" aria-expanded={open} onClick={toggle}>
          Load saved…
          <ChevronDownIcon size={13} className="text-text-3" />
        </Button>
      )}
    >
      {({ close }) => (
        <>
          <MenuLabel>Presets</MenuLabel>
          {presets.map((view) => (
            <MenuItem
              key={view.id}
              onClick={() => {
                onLoad(view);
                close();
              }}
            >
              {view.name}
            </MenuItem>
          ))}
          {saved.length > 0 ? (
            <>
              <MenuSeparator />
              <MenuLabel>Saved</MenuLabel>
              {saved.map((view) => (
                <MenuItem
                  key={view.id}
                  onClick={() => {
                    onLoad(view);
                    close();
                  }}
                >
                  {view.name}
                </MenuItem>
              ))}
            </>
          ) : null}
        </>
      )}
    </Popover>
  );
}
