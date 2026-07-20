import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  as?: "div" | "section" | "article";
  padded?: boolean;
};

/**
 * Base container used across dashboards, tables and panels.
 * Matches the design's 11px radius / thin border / soft shadow surface.
 */
export function Card({
  as: Tag = "div",
  padded = false,
  className,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={cn(
        "bg-surface rounded-panel border-border-token border shadow-(--shadow-elev-1)",
        padded && "p-[15px_18px]",
        className,
      )}
      {...rest}
    />
  );
}

export function CardHeader({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-3 px-4.5 pt-3.75 pb-3", className)}
      {...rest}
    />
  );
}

export function CardTitle({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-text text-[14px] font-semibold", className)}
      {...rest}
    />
  );
}

export function CardSubtitle({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("text-text-3 mt-0.5 text-[11.5px]", className)}
      {...rest}
    />
  );
}

export function CardBody({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-4.5 pb-3.75", className)} {...rest} />;
}
