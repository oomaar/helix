"use client";

import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useFieldControl, useFieldInvalid } from "./field";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function Input({
  leading,
  trailing,
  className,
  id,
  ...rest
}: InputProps) {
  const control = useFieldControl(id);
  const invalid = useFieldInvalid();

  return (
    <div
      className={cn(
        "bg-surface border-border-token focus-within:border-brand-line focus-within:ring-brand-soft flex h-8 items-center gap-2 rounded-[8px] border px-2.5 focus-within:ring-2",
        invalid && "border-danger",
        className,
      )}
    >
      {leading ? (
        <span className="text-text-3 flex-none">{leading}</span>
      ) : null}
      <input
        className="text-text placeholder:text-text-3 min-w-0 flex-1 border-none bg-transparent font-sans text-[12.5px] outline-none"
        {...rest}
        {...control}
      />
      {trailing ? (
        <span className="text-text-3 flex-none">{trailing}</span>
      ) : null}
    </div>
  );
}
