"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { useFieldControl, useFieldInvalid } from "./field";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

/** Multi-line text control matching the `Input` surface treatment. */
export function Textarea({ invalid, className, id, ...rest }: TextareaProps) {
  const control = useFieldControl(id);
  const fieldInvalid = useFieldInvalid();

  return (
    <textarea
      className={cn(
        "bg-surface border-border-token text-text placeholder:text-text-3 w-full resize-y rounded-[8px] border px-2.5 py-2 font-sans text-[12.5px] leading-normal outline-none",
        "focus:border-brand-line focus:ring-brand-soft focus:ring-2",
        (invalid ?? fieldInvalid) && "border-danger",
        className,
      )}
      {...rest}
      {...control}
    />
  );
}
