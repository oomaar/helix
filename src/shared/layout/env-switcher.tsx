"use client";

import { useState } from "react";
import { CheckIcon, ChevronDownIcon } from "@/shared/icons";
import {
  MenuItem,
  MenuLabel,
  Popover,
  StatusDot,
  type StatusTone,
} from "@/shared/ui";

const ENVIRONMENTS: readonly { name: string; tone: StatusTone }[] = [
  { name: "Production", tone: "success" },
  { name: "Staging", tone: "warn" },
  { name: "Development", tone: "info" },
];

export function EnvSwitcher() {
  const [env, setEnv] = useState(ENVIRONMENTS[0]!.name);
  const current = ENVIRONMENTS.find((e) => e.name === env) ?? ENVIRONMENTS[0]!;

  return (
    <Popover
      label="Environment"
      panelClassName="w-52"
      button={({ toggle, open }) => (
        <button
          type="button"
          aria-label={`Environment: ${env}`}
          aria-expanded={open}
          onClick={toggle}
          className="bg-surface-2 text-text border-border-token hover:border-border-strong hidden h-8 cursor-pointer items-center gap-1.75 rounded-[8px] border px-2.5 text-[12px] font-medium sm:flex"
        >
          <StatusDot tone={current.tone} />
          {env}
          <ChevronDownIcon size={13} className="text-text-3" />
        </button>
      )}
    >
      {({ close }) => (
        <>
          <MenuLabel>Environment</MenuLabel>
          {ENVIRONMENTS.map((e) => (
            <MenuItem
              key={e.name}
              icon={<StatusDot tone={e.tone} />}
              hint={
                e.name === env ? (
                  <CheckIcon size={14} className="text-brand" />
                ) : null
              }
              onClick={() => {
                setEnv(e.name);
                close();
              }}
            >
              {e.name}
            </MenuItem>
          ))}
        </>
      )}
    </Popover>
  );
}
