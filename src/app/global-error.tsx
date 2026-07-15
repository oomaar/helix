"use client";

import { useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { AnomaliesIcon } from "@/shared/icons";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Wired up to reporting in a later phase.
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="bg-bg text-text flex min-h-screen items-center justify-center">
          <EmptyState
            icon={<AnomaliesIcon size={20} />}
            title="Something went wrong"
            description="An unexpected error occurred. You can try again or head back to the dashboard."
            action={
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
            }
          />
        </div>
      </body>
    </html>
  );
}
