"use client";

import type { Environment, ResourceConfigSnapshot } from "@/lib/backend";
import { FormRow, FormSection } from "@/shared/forms";
import { Callout, Field, Input, Select, Switch } from "@/shared/ui";
import {
  capabilitiesFor,
  ENVIRONMENT_OPTIONS,
  instanceTypeOptions,
  MAINTENANCE_WINDOW_OPTIONS,
  RETENTION_OPTIONS,
} from "../capabilities";
import type { ConfigStepProps } from "../types";

type SettingsStepProps = ConfigStepProps & {
  snapshot: ResourceConfigSnapshot;
};

/**
 * One form, many shapes: the sections rendered here are chosen by the resource
 * kind's capabilities, and several fields appear only once the switch they
 * belong to is on.
 */
export function SettingsStep({
  snapshot,
  draft,
  set,
  errors,
}: SettingsStepProps) {
  const caps = capabilitiesFor(snapshot.kind);

  return (
    <>
      <FormSection title="General">
        <FormRow>
          <Field label="Instance type" htmlFor="cfg-type">
            <Select
              id="cfg-type"
              value={draft.instanceType}
              options={instanceTypeOptions(
                snapshot.kind,
                snapshot.config.instanceType,
              )}
              onChange={(value) => set({ instanceType: value })}
            />
          </Field>
          <Field
            label="Environment"
            htmlFor="cfg-env"
            hint="Changing environment reprovisions network placement."
          >
            <Select
              id="cfg-env"
              value={draft.environment}
              options={ENVIRONMENT_OPTIONS}
              onChange={(value) => set({ environment: value as Environment })}
            />
          </Field>
        </FormRow>

        {caps.sizing ? (
          <Field
            label="Desired instances"
            htmlFor="cfg-instances"
            error={errors.instances}
          >
            <Input
              id="cfg-instances"
              type="number"
              min={1}
              max={64}
              value={String(draft.instances)}
              className="font-mono"
              onChange={(e) => set({ instances: Number(e.target.value) })}
            />
          </Field>
        ) : null}
      </FormSection>

      {caps.autoscaling ? (
        <FormSection title="Autoscaling">
          <div className="border-border-token rounded-[8px] border px-3 py-2.5">
            <Switch
              label="Enable autoscaling"
              description="Scale between the bounds below based on CPU pressure."
              checked={draft.autoscaling}
              onChange={(v) => set({ autoscaling: v })}
            />
          </div>
          {/* Conditional: bounds are meaningless with autoscaling off. */}
          {draft.autoscaling ? (
            <FormRow>
              <Field
                label="Minimum instances"
                htmlFor="cfg-min"
                error={errors.minInstances}
              >
                <Input
                  id="cfg-min"
                  type="number"
                  min={1}
                  value={String(draft.minInstances)}
                  className="font-mono"
                  onChange={(e) =>
                    set({ minInstances: Number(e.target.value) })
                  }
                />
              </Field>
              <Field
                label="Maximum instances"
                htmlFor="cfg-max"
                error={errors.maxInstances}
              >
                <Input
                  id="cfg-max"
                  type="number"
                  min={1}
                  value={String(draft.maxInstances)}
                  className="font-mono"
                  onChange={(e) =>
                    set({ maxInstances: Number(e.target.value) })
                  }
                />
              </Field>
            </FormRow>
          ) : null}
        </FormSection>
      ) : null}

      {caps.availability ? (
        <FormSection title="Availability">
          <div className="border-border-token rounded-[8px] border px-3 py-2.5">
            <Switch
              label="Multi-AZ deployment"
              description="Synchronous standby in a second availability zone."
              checked={draft.multiAz}
              onChange={(v) => set({ multiAz: v })}
            />
          </div>
          {draft.multiAz ? (
            <Field
              label="Read replicas"
              htmlFor="cfg-replicas"
              error={errors.replicas}
              hint="Each replica adds read capacity and cost."
            >
              <Input
                id="cfg-replicas"
                type="number"
                min={1}
                max={5}
                value={String(draft.replicas)}
                className="font-mono"
                onChange={(e) => set({ replicas: Number(e.target.value) })}
              />
            </Field>
          ) : null}
        </FormSection>
      ) : null}

      {caps.storage ? (
        <FormSection title="Storage">
          <FormRow>
            <Field
              label="Volume size"
              htmlFor="cfg-storage"
              error={errors.storageGb}
              hint={`Currently ${snapshot.config.storageGb.toLocaleString()} GB · grow only.`}
            >
              <Input
                id="cfg-storage"
                type="number"
                min={snapshot.config.storageGb}
                value={String(draft.storageGb)}
                className="font-mono"
                trailing={<span className="text-text-3 text-[11.5px]">GB</span>}
                onChange={(e) => set({ storageGb: Number(e.target.value) })}
              />
            </Field>
            <Field
              label="Provisioned IOPS"
              htmlFor="cfg-iops"
              error={errors.iops}
            >
              <Input
                id="cfg-iops"
                type="number"
                min={3000}
                max={80000}
                step={1000}
                value={String(draft.iops)}
                className="font-mono"
                onChange={(e) => set({ iops: Number(e.target.value) })}
              />
            </Field>
          </FormRow>
        </FormSection>
      ) : null}

      {caps.backups ? (
        <FormSection title="Backups">
          <FormRow>
            <Field label="Retention" htmlFor="cfg-retention">
              <Select
                id="cfg-retention"
                value={String(draft.backupRetentionDays)}
                options={RETENTION_OPTIONS}
                onChange={(value) =>
                  set({ backupRetentionDays: Number(value) })
                }
              />
            </Field>
            <Field label="Maintenance window" htmlFor="cfg-window">
              <Select
                id="cfg-window"
                value={draft.maintenanceWindow}
                options={MAINTENANCE_WINDOW_OPTIONS}
                onChange={(value) => set({ maintenanceWindow: value })}
              />
            </Field>
          </FormRow>
          <div className="border-border-token rounded-[8px] border px-3 py-2.5">
            <Switch
              label="Point-in-time recovery"
              description="Continuous WAL archiving. Adds roughly $240/mo."
              checked={draft.pitr}
              onChange={(v) => set({ pitr: v })}
            />
          </div>
        </FormSection>
      ) : null}

      <FormSection title="Security">
        <Field
          label="KMS key"
          htmlFor="cfg-key"
          required
          error={errors.encryptionKey}
          hint="Rotating the key triggers a re-encryption cycle."
        >
          <Input
            id="cfg-key"
            value={draft.encryptionKey}
            className="font-mono"
            onChange={(e) => set({ encryptionKey: e.target.value })}
          />
        </Field>

        <div className="border-border-token divide-border-token divide-y rounded-[8px] border">
          {caps.networkAccess ? (
            <div className="px-3 py-2.5">
              <Switch
                label="Public network access"
                description="Expose the resource outside its VPC."
                checked={draft.publicAccess}
                onChange={(v) => set({ publicAccess: v })}
              />
            </div>
          ) : null}
          <div className="px-3 py-2.5">
            <Switch
              label="Deletion protection"
              description="Block destroy operations until explicitly disabled."
              checked={draft.deletionProtection}
              onChange={(v) => set({ deletionProtection: v })}
            />
          </div>
        </div>

        {errors.publicAccess ? (
          <Callout tone="danger">{errors.publicAccess}</Callout>
        ) : null}
      </FormSection>
    </>
  );
}
