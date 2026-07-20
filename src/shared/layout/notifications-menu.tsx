"use client";

import Link from "next/link";
import { useState } from "react";
import { BACKEND_NOW, getNotifications } from "@/lib/backend";
import { relativeTime } from "@/lib/utils";
import { BellIcon } from "@/shared/icons";
import { useAsync } from "@/shared/hooks/use-async";
import {
  EmptyState,
  IconButton,
  Popover,
  Skeleton,
  StatusDot,
} from "@/shared/ui";

export function NotificationsMenu() {
  const state = useAsync(() => getNotifications(8), []);
  const [readAll, setReadAll] = useState(false);
  const unreadCount = readAll
    ? 0
    : (state.data?.filter((n) => n.unread).length ?? 0);

  return (
    <Popover
      label="Notifications"
      button={({ toggle, open }) => (
        <IconButton
          aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          aria-expanded={open}
          onClick={toggle}
        >
          <BellIcon size={16} />
          {unreadCount > 0 ? (
            <span className="bg-danger border-surface absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 px-1 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </IconButton>
      )}
      panelClassName="w-80 p-0"
    >
      {({ close }) => (
        <>
          <div className="border-border-token flex items-center justify-between border-b px-3.5 py-2.5">
            <span className="text-text text-[13px] font-semibold">
              Notifications
            </span>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => setReadAll(true)}
                className="text-brand cursor-pointer text-[11.5px] font-medium hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-90 overflow-y-auto p-1.5">
            {state.error ? (
              <EmptyState
                title="Couldn't load notifications"
                description={state.error.message}
                className="py-8"
              />
            ) : state.loading && !state.data ? (
              <div className="space-y-2 p-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : state.data && state.data.length > 0 ? (
              <ul>
                {state.data.map((n) => {
                  const isUnread = n.unread && !readAll;
                  return (
                    <li key={n.id}>
                      <Link
                        href={n.href}
                        onClick={close}
                        className="hover:bg-hover rounded-control flex items-start gap-2.5 px-2 py-2 transition-colors"
                      >
                        <StatusDot tone={n.tone} className="mt-1.5 flex-none" />
                        <div className="min-w-0 flex-1">
                          <div
                            className={
                              isUnread
                                ? "text-text truncate text-[12.5px] font-semibold"
                                : "text-text-2 truncate text-[12.5px]"
                            }
                          >
                            {n.title}
                          </div>
                          <div className="text-text-3 truncate text-[11px]">
                            {n.body}
                          </div>
                        </div>
                        <span className="text-text-3 flex-none font-mono text-[10px]">
                          {relativeTime(n.at, BACKEND_NOW)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                title="You're all caught up"
                description="No new notifications."
                className="py-8"
              />
            )}
          </div>

          <div className="border-border-token border-t px-1.5 py-1.5">
            <Link
              href="/audit"
              onClick={close}
              className="text-text-2 hover:bg-hover rounded-control flex items-center justify-center px-2 py-1.5 text-[12px] font-medium transition-colors"
            >
              View all activity
            </Link>
          </div>
        </>
      )}
    </Popover>
  );
}
