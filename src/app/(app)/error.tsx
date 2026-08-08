"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AnomaliesIcon } from "@/shared/icons";
import { Button, Card, EmptyState } from "@/shared/ui";

/**
 * Error boundary for every screen inside the app shell.
 *
 * Scoped to the `(app)` segment rather than the root so a thrown render error
 * takes out only the page body — the sidebar, top bar and command palette stay
 * usable, and `reset()` re-renders the segment without a full reload.
 */

type AppSegmentErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppSegmentError({
  error,
  reset,
}: AppSegmentErrorProps) {
  useEffect(() => {
    // Wired up to reporting in a later phase.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-350 px-4 py-5 md:p-[22px_26px_60px]">
      <Card>
        <EmptyState
          icon={<AnomaliesIcon size={20} />}
          title="This screen failed to load"
          description={
            error.message ||
            "An unexpected error occurred while rendering this page."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
              <Link href="/dashboard">
                <Button variant="secondary">Back to dashboard</Button>
              </Link>
            </div>
          }
        />
        {error.digest ? (
          <p className="text-text-3 pb-4 text-center font-mono text-[11px]">
            Reference: {error.digest}
          </p>
        ) : null}
      </Card>
    </div>
  );
}
