import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

/** Multi-line text control matching the `Input` surface treatment. */
export function Textarea({ invalid, className, ...rest }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "bg-surface border-border-token text-text placeholder:text-text-3 w-full resize-y rounded-[8px] border px-2.5 py-2 font-sans text-[12.5px] leading-normal outline-none",
        "focus:border-brand-line focus:ring-brand-soft focus:ring-2",
        invalid && "border-danger",
        className,
      )}
      {...rest}
    />
  );
}
