"use client";

import { useState } from "react";
import {
  type AuditAction,
  type AuditResult,
  auditFacets,
  getAuditSummary,
  listAuditEvents,
  listAuditTimeline,
} from "@/lib/backend";
import { printDocument } from "@/lib/utils";
import { DownloadIcon, SearchIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import {
  Button,
  Input,
  PageHeader,
  Pagination,
  RadioGroup,
  Select,
} from "@/shared/ui";
import { AuditTable } from "./components/audit-table";
import { AuditTimeline } from "./components/audit-timeline";
import { EventDetailDrawer } from "./components/event-detail-drawer";
import { ACTION_OPTIONS, RESULT_OPTIONS } from "./constants";

type View = "list" | "timeline";

const PAGE_SIZE = 25;

export function AuditView() {
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<AuditAction | "all">("all");
  const [actorId, setActorId] = useState<string | "all">("all");
  const [result, setResult] = useState<AuditResult | "all">("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const summary = useAsync(() => getAuditSummary(), []);
  const facets = useAsync(() => auditFacets(), []);

  const feed = useAsync(async () => {
    const filters = { search, action, actorId, result };
    if (view === "list") {
      const p = await listAuditEvents(filters, page, PAGE_SIZE);
      return {
        kind: "list" as const,
        items: p.items,
        total: p.total,
        page: p.page,
        pageSize: p.pageSize,
      };
    }
    const items = await listAuditTimeline(filters);
    return { kind: "timeline" as const, items };
  }, [view, search, action, actorId, result, page]);

  const resetPage = () => setPage(1);
  const flat = feed.data?.kind === "list" ? feed.data : null;
  const timelineItems = feed.data?.kind === "timeline" ? feed.data.items : null;

  const actorOptions = [
    { value: "all", label: "All actors" },
    ...(facets.data?.actors ?? []).map((a) => ({ value: a.id, label: a.name })),
  ];

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Audit Log"
        description={
          summary.data
            ? `Immutable event stream · retained ${summary.data.retainedDays} days · ${summary.data.scope} scope`
            : "Immutable event stream."
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => printDocument("Helix — Audit Log")}
          >
            <DownloadIcon size={14} />
            Export evidence
          </Button>
        }
      />

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <Input
          className="h-9 min-w-56 flex-1"
          leading={<SearchIcon size={14} />}
          placeholder="Search by actor, action, resource, IP, id…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            resetPage();
          }}
        />
        <Select
          className="w-40"
          value={action}
          options={[...ACTION_OPTIONS]}
          onChange={(v) => {
            setAction(v as AuditAction | "all");
            resetPage();
          }}
        />
        <Select
          className="w-44"
          value={actorId}
          options={actorOptions}
          onChange={(v) => {
            setActorId(v);
            resetPage();
          }}
        />
        <Select
          className="w-36"
          value={result}
          options={[...RESULT_OPTIONS]}
          onChange={(v) => {
            setResult(v as AuditResult | "all");
            resetPage();
          }}
        />
        <RadioGroup
          ariaLabel="View"
          value={view}
          onChange={(v) => {
            setView(v as View);
            resetPage();
          }}
          options={[
            { value: "list", label: "List" },
            { value: "timeline", label: "Timeline" },
          ]}
        />
      </div>

      {view === "list" ? (
        <div className="space-y-3.5">
          <AuditTable
            events={flat?.items ?? null}
            loading={feed.loading}
            onSelect={setSelectedId}
          />
          {flat && flat.total > 0 ? (
            <Pagination
              page={flat.page}
              pageSize={flat.pageSize}
              total={flat.total}
              onPageChange={setPage}
            />
          ) : null}
        </div>
      ) : (
        <AuditTimeline
          events={timelineItems}
          loading={feed.loading}
          onSelect={setSelectedId}
        />
      )}

      <EventDetailDrawer
        eventId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
