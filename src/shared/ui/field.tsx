"use client";

import { createContext, type ReactNode, useContext, useId } from "react";
import { cn } from "@/lib/utils";

type FieldControl = {
  id: string;
  labelId: string;
  invalid: boolean;
  describedBy?: string;
};

const FieldContext = createContext<FieldControl | null>(null);

/** Props a form control should spread to inherit its `Field`'s wiring. */
export type FieldControlProps = {
  id?: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

/**
 * Wiring for grouping controls (radio groups, chip groups) which `<label for>`
 * can't target — they point back at the label element instead.
 */
export function useFieldGroup(): {
  "aria-labelledby"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
} {
  const ctx = useContext(FieldContext);
  if (!ctx) return {};
  return {
    "aria-labelledby": ctx.labelId,
    "aria-describedby": ctx.describedBy,
    "aria-invalid": ctx.invalid ? true : undefined,
  };
}

/**
 * Connects a control to the `Field` wrapping it: label association, invalid
 * state, and a pointer to the error or hint text. Controls call this instead of
 * every call site having to thread ids and aria attributes by hand.
 */
export function useFieldControl(explicitId?: string): FieldControlProps {
  const ctx = useContext(FieldContext);
  if (!ctx) return explicitId === undefined ? {} : { id: explicitId };
  return {
    id: explicitId ?? ctx.id,
    "aria-invalid": ctx.invalid ? true : undefined,
    "aria-describedby": ctx.describedBy,
  };
}

/** True when the enclosing `Field` is reporting an error. */
export function useFieldInvalid(): boolean {
  return useContext(FieldContext)?.invalid ?? false;
}

type FieldProps = {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

/** Labeled form control wrapper: label (+ required mark), control, error/hint. */
export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  const generated = useId();
  const controlId = htmlFor ?? generated;
  const labelId = `${controlId}-label`;
  const errorId = `${controlId}-error`;
  const hintId = `${controlId}-hint`;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        id={labelId}
        htmlFor={controlId}
        className="text-text-2 flex items-center gap-1 text-[12px] font-medium"
      >
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <FieldContext.Provider
        value={{
          id: controlId,
          labelId,
          invalid: Boolean(error),
          describedBy: error ? errorId : hint ? hintId : undefined,
        }}
      >
        {children}
      </FieldContext.Provider>
      {error ? (
        <p id={errorId} role="alert" className="text-danger text-[11px]">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-text-3 text-[11px]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
