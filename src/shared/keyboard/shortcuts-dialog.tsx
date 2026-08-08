"use client";

import { CloseIcon } from "@/shared/icons";
import { NAV_GROUPS } from "@/shared/nav/nav-config";
import { useSession } from "@/shared/session";
import { Dialog, IconButton, Kbd } from "@/shared/ui";
import {
  GENERAL_SHORTCUTS,
  GO_TO_PREFIX,
  modifierKey,
  NAVIGATION_HINT,
  type ShortcutKeys,
} from "./shortcuts";

/** Renders a shortcut's keys as the same chips used in the palette footer. */
function Keys({ keys }: { keys: ShortcutKeys }) {
  return (
    <span className="flex flex-none items-center gap-1">
      {keys.map((key, i) => (
        <Kbd key={`${key}-${i}`}>{key === "MOD" ? modifierKey() : key}</Kbd>
      ))}
    </span>
  );
}

function Row({ label, keys }: { label: string; keys: ShortcutKeys }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-text-2 min-w-0 flex-1 text-[12.5px]">{label}</span>
      <Keys keys={keys} />
    </div>
  );
}

/**
 * The keyboard contract, rendered from the same definitions the listener uses.
 * Navigation entries are filtered by permission, so the guide never advertises
 * a jump the signed-in role can't make.
 */
export function ShortcutsDialog({ onClose }: { onClose: () => void }) {
  const { can } = useSession();

  const navShortcuts = NAV_GROUPS.flatMap((group) =>
    group.items
      .filter((item) => item.shortcut && (!item.scope || can(item.scope)))
      .map((item) => ({
        id: item.id,
        label: item.label,
        keys: [GO_TO_PREFIX.toUpperCase(), item.shortcut!.toUpperCase()],
      })),
  );

  return (
    <Dialog
      open
      onClose={onClose}
      align="center"
      labelledBy="shortcuts-title"
      className="max-w-160"
    >
      <div className="border-border-token flex items-center gap-3 border-b px-4 py-3">
        <h2
          id="shortcuts-title"
          className="text-text flex-1 text-[14px] font-semibold"
        >
          Keyboard shortcuts
        </h2>
        <IconButton size={28} aria-label="Close" onClick={onClose}>
          <CloseIcon size={15} />
        </IconButton>
      </div>

      <div className="grid max-h-[62vh] grid-cols-1 gap-x-8 overflow-y-auto px-4 py-3 sm:grid-cols-2">
        <section>
          <h3 className="text-text-3 pb-1 text-[10px] font-semibold tracking-wider uppercase">
            General
          </h3>
          <div className="divide-border-token divide-y">
            {GENERAL_SHORTCUTS.map((shortcut) => (
              <Row
                key={shortcut.id}
                label={shortcut.label}
                keys={shortcut.keys}
              />
            ))}
          </div>
        </section>

        <section className="mt-4 sm:mt-0">
          <h3 className="text-text-3 flex items-baseline gap-2 pb-1 text-[10px] font-semibold tracking-wider uppercase">
            Go to
            <span className="text-text-3 text-[10px] font-normal normal-case">
              {NAVIGATION_HINT}
            </span>
          </h3>
          <div className="divide-border-token divide-y">
            {navShortcuts.map((shortcut) => (
              <Row
                key={shortcut.id}
                label={shortcut.label}
                keys={shortcut.keys}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Same footer treatment as the command palette. */}
      <div className="border-border-token text-text-3 flex flex-wrap items-center gap-3 border-t px-4 py-2 text-[10.5px]">
        <span className="flex items-center gap-1">
          <Kbd>{GO_TO_PREFIX.toUpperCase()}</Kbd>
          then a key to jump
        </span>
        <span className="flex items-center gap-1">
          <Kbd>?</Kbd>
          to reopen this guide
        </span>
        <span className="flex items-center gap-1">
          <Kbd>Esc</Kbd>
          to close
        </span>
      </div>
    </Dialog>
  );
}
