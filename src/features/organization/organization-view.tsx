"use client";

import { useEffect, useState } from "react";
import {
  type Environment,
  getOrgOverview,
  getOrgSettings,
  type OrgSettings,
  type Region,
  updateOrgSettings,
} from "@/lib/backend";
import { numberCompact } from "@/lib/utils";
import { useAsync } from "@/shared/hooks/use-async";
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  Select,
  Skeleton,
  Switch,
  Toast,
  useToast,
} from "@/shared/ui";
import { SettingsSection } from "./components/settings-section";
import {
  CURRENCY_OPTIONS,
  ENVIRONMENT_OPTIONS,
  REGION_OPTIONS,
  SESSION_TIMEOUT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "./constants";

export function OrganizationView() {
  const overview = useAsync(() => getOrgOverview(), []);
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [baseline, setBaseline] = useState<OrgSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let active = true;
    getOrgSettings().then((s) => {
      if (active) {
        setSettings(s);
        setBaseline(s);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const set = (patch: Partial<OrgSettings>) =>
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));

  const dirty =
    settings != null &&
    baseline != null &&
    JSON.stringify(settings) !== JSON.stringify(baseline);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const saved = await updateOrgSettings(settings);
      setSettings(saved);
      setBaseline(saved);
      toast.show("Organization settings saved");
    } finally {
      setSaving(false);
    }
  };

  const reset = () => setSettings(baseline);

  const stats = [
    { label: "Members", value: overview.data?.members },
    { label: "Teams", value: overview.data?.teams },
    { label: "Resources", value: overview.data?.resources },
    { label: "Cloud accounts", value: overview.data?.providers },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 md:p-[22px_26px_60px]">
      <PageHeader
        title="Organization"
        description={
          settings
            ? `${settings.name} · ${settings.domain}`
            : "Organization profile, security and defaults."
        }
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={reset}
              disabled={!dirty || saving}
            >
              Reset
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={save}
              loading={saving}
              disabled={!dirty}
            >
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      />

      <div className="mb-3.5 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-4 py-3.5">
            <div className="text-text-3 text-[11px] font-medium">{s.label}</div>
            {s.value === undefined ? (
              <Skeleton className="mt-1.5 h-6 w-16" />
            ) : (
              <div className="text-text mt-1 text-[22px] leading-none font-bold tracking-tight">
                {numberCompact(s.value)}
              </div>
            )}
          </Card>
        ))}
      </div>

      {!settings ? (
        <div className="space-y-3.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="rounded-panel h-48" />
          ))}
        </div>
      ) : (
        <div className="space-y-3.5">
          <SettingsSection
            title="Profile"
            description="How your organization appears across Helix."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Organization name">
                <Input
                  value={settings.name}
                  onChange={(e) => set({ name: e.target.value })}
                />
              </Field>
              <Field label="Primary domain">
                <Input
                  value={settings.domain}
                  onChange={(e) => set({ domain: e.target.value })}
                />
              </Field>
              <Field label="Billing email">
                <Input
                  type="email"
                  value={settings.billingEmail}
                  onChange={(e) => set({ billingEmail: e.target.value })}
                />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Security & access"
            description="Single sign-on and account protection."
          >
            <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="SSO provider">
                <Input
                  value={settings.ssoProvider}
                  onChange={(e) => set({ ssoProvider: e.target.value })}
                />
              </Field>
              <Field label="Session timeout">
                <Select
                  value={String(settings.sessionTimeoutMins)}
                  options={[...SESSION_TIMEOUT_OPTIONS]}
                  onChange={(v) => set({ sessionTimeoutMins: Number(v) })}
                />
              </Field>
              <Field
                label="Allowed email domains"
                hint="Comma-separated; new members must match."
              >
                <Input
                  value={settings.allowedDomains}
                  onChange={(e) => set({ allowedDomains: e.target.value })}
                />
              </Field>
            </div>
            <div className="border-border-token divide-border-token divide-y rounded-lg border">
              <div className="px-3 py-2.5">
                <Switch
                  label="Enforce SSO"
                  description="Require members to sign in through the SSO provider."
                  checked={settings.enforceSso}
                  onChange={(v) => set({ enforceSso: v })}
                />
              </div>
              <div className="px-3 py-2.5">
                <Switch
                  label="Require MFA"
                  description="Members must enroll in multi-factor authentication."
                  checked={settings.requireMfa}
                  onChange={(v) => set({ requireMfa: v })}
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Defaults"
            description="Applied to new resources, budgets and reports."
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Default environment">
                <Select
                  value={settings.defaultEnvironment}
                  options={[...ENVIRONMENT_OPTIONS]}
                  onChange={(v) =>
                    set({ defaultEnvironment: v as Environment })
                  }
                />
              </Field>
              <Field label="Default region">
                <Select
                  value={settings.defaultRegion}
                  options={[...REGION_OPTIONS]}
                  onChange={(v) => set({ defaultRegion: v as Region })}
                />
              </Field>
              <Field label="Currency">
                <Select
                  value={settings.currency}
                  options={[...CURRENCY_OPTIONS]}
                  onChange={(v) => set({ currency: v })}
                />
              </Field>
              <Field label="Timezone">
                <Select
                  value={settings.timezone}
                  options={[...TIMEZONE_OPTIONS]}
                  onChange={(v) => set({ timezone: v })}
                />
              </Field>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Danger zone"
            description="Irreversible actions for the whole organization."
          >
            <div className="border-danger/30 bg-danger-soft/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-3">
              <div>
                <div className="text-text text-[12.5px] font-medium">
                  Delete organization
                </div>
                <div className="text-text-3 text-[11px]">
                  Permanently removes all resources, data and members.
                </div>
              </div>
              <Button
                size="sm"
                variant="danger"
                onClick={() =>
                  toast.show("Deleting an organization requires support.")
                }
              >
                Delete organization
              </Button>
            </div>
          </SettingsSection>
        </div>
      )}

      <Toast message={toast.message} />
    </div>
  );
}
