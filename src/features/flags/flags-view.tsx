"use client";

import { useEffect, useState } from "react";
import {
  type FeatureFlagWithOwner,
  type FlagPatch,
  type FlagRollout,
  listFeatureFlags,
  updateFlag,
} from "@/lib/backend";
import { SearchIcon } from "@/shared/icons";
import {
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
} from "@/shared/ui";
import { FlagCard } from "./components/flag-card";
import { ROLLOUT_FILTER_OPTIONS } from "./constants";

export function FlagsView() {
  const [flags, setFlags] = useState<FeatureFlagWithOwner[] | null>(null);
  const [search, setSearch] = useState("");
  const [rollout, setRollout] = useState<FlagRollout | "all">("all");

  useEffect(() => {
    let active = true;
    listFeatureFlags().then((f) => {
      if (active) setFlags([...f]);
    });
    return () => {
      active = false;
    };
  }, []);

  const onPatch = (id: string, patch: FlagPatch) => {
    setFlags(
      (prev) =>
        prev?.map((f) => (f.id === id ? { ...f, ...patch } : f)) ?? prev,
    );
    void updateFlag(id, patch);
  };

  const total = flags?.length ?? 0;
  const active = flags?.filter((f) => f.rollout !== "off").length ?? 0;
  const filtered =
    flags?.filter((f) => {
      if (rollout !== "all" && f.rollout !== rollout) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!`${f.name} ${f.key} ${f.description}`.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    }) ?? [];

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Feature Flags"
        description={
          flags
            ? `Progressive rollout & environment targeting · ${total} flags · ${active} active`
            : "Progressive rollout & environment targeting."
        }
      />

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-56 flex-1"
          leading={<SearchIcon size={14} />}
          placeholder="Search flags by key, name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          className="w-40"
          value={rollout}
          options={[...ROLLOUT_FILTER_OPTIONS]}
          onChange={(v) => setRollout(v as FlagRollout | "all")}
        />
      </div>

      {!flags ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            title="No flags match"
            description="Try a different search term or rollout filter."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((flag) => (
            <FlagCard key={flag.id} flag={flag} onPatch={onPatch} />
          ))}
        </div>
      )}
    </div>
  );
}
