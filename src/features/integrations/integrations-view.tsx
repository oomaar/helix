"use client";

import { useEffect, useState } from "react";
import {
  type CloudAccount,
  type Integration,
  listCloudAccounts,
  listIntegrations,
  setIntegrationConnected,
} from "@/lib/backend";
import { useAsync } from "@/shared/hooks/use-async";
import { PageHeader, Skeleton } from "@/shared/ui";
import { CloudAccountCard } from "./components/cloud-account-card";
import { IntegrationCard } from "./components/integration-card";

function SectionHeading({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mt-5 mb-3 flex items-center gap-2 first:mt-0">
      <h2 className="text-text text-[14px] font-semibold">{title}</h2>
      {count !== undefined ? (
        <span className="text-text-3 text-[12px]">· {count}</span>
      ) : null}
    </div>
  );
}

export function IntegrationsView() {
  const accounts = useAsync(() => listCloudAccounts(), []);
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listIntegrations().then((list) => {
      if (active) setIntegrations([...list]);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 3000);
    return () => clearTimeout(t);
  }, [feedback]);

  const onToggle = async (integration: Integration) => {
    const next = !integration.connected;
    setBusyId(integration.id);
    setIntegrations(
      (prev) =>
        prev?.map((i) =>
          i.id === integration.id ? { ...i, connected: next } : i,
        ) ?? prev,
    );
    try {
      await setIntegrationConnected(integration.id, next);
      setFeedback(`${next ? "Connected" : "Disconnected"} ${integration.name}`);
    } finally {
      setBusyId(null);
    }
  };

  const onManage = (account: CloudAccount) =>
    setFeedback(`Manage ${account.displayName} isn’t available in this demo.`);

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Integrations"
        description="Connected cloud accounts, data sources & tooling"
      />

      <SectionHeading title="Cloud accounts" count={accounts.data?.length} />
      {accounts.loading && !accounts.data ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-52" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {accounts.data?.map((a) => (
            <CloudAccountCard key={a.id} account={a} onManage={onManage} />
          ))}
        </div>
      )}

      <SectionHeading
        title="Data sources & tooling"
        count={integrations?.length}
      />
      {!integrations ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-40" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {integrations.map((i) => (
            <IntegrationCard
              key={i.id}
              integration={i}
              busy={busyId === i.id}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {feedback ? (
        <div className="fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
          <div className="bg-raised border-border-strong text-text rounded-lg border px-4 py-2 text-[12.5px] shadow-(--shadow-elev-2)">
            {feedback}
          </div>
        </div>
      ) : null}
    </div>
  );
}
