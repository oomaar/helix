"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type MenuItemProps = {
  icon?: ReactNode;
  children: ReactNode;
  hint?: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
  role?: string;
};

/** A single row inside a Popover panel — renders as a link or a button. */
export function MenuItem({
  icon,
  children,
  hint,
  href,
  onClick,
  tone = "default",
  role = "menuitem",
}: MenuItemProps) {
  const className = cn(
    "rounded-control flex w-full cursor-pointer items-center gap-2.5 px-2 py-1.5 text-left text-[12.5px] transition-colors",
    tone === "danger"
      ? "text-danger hover:bg-danger-soft"
      : "text-text-2 hover:bg-hover hover:text-text",
  );
  const content = (
    <>
      {icon ? <span className="flex-none">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {hint ? <span className="text-text-3 flex-none">{hint}</span> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} role={role} className={className} onClick={onClick}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" role={role} className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-text-3 px-2 pt-1.5 pb-1 text-[10px] font-semibold tracking-wider uppercase">
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div className="bg-border-token my-1 h-px" role="separator" />;
}
