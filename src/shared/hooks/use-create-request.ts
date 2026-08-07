"use client";

import { useEffect, useRef } from "react";
import {
  claimCreateRequest,
  CREATE_REQUEST_EVENT,
  type CreateTarget,
} from "@/shared/lib/app-events";

/**
 * Opens a screen's create form when something elsewhere asked for it — the
 * command palette's "Create a policy", for example.
 *
 * Handles both orderings: a request parked before this view mounted (the
 * palette navigated here) is claimed on mount, and one raised while the view is
 * already open arrives through the event.
 */
export function useCreateRequest(target: CreateTarget, open: () => void): void {
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  useEffect(() => {
    if (claimCreateRequest(target)) openRef.current();

    const onRequest = (event: Event) => {
      const detail = (event as CustomEvent<{ target: CreateTarget }>).detail;
      if (detail?.target === target && claimCreateRequest(target)) {
        openRef.current();
      }
    };

    window.addEventListener(CREATE_REQUEST_EVENT, onRequest);
    return () => window.removeEventListener(CREATE_REQUEST_EVENT, onRequest);
  }, [target]);
}
