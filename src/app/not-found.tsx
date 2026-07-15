import Link from "next/link";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import { SearchIcon } from "@/shared/icons";

export default function NotFound() {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <EmptyState
        icon={<SearchIcon size={20} />}
        title="Page not found"
        description="The screen you were looking for doesn't exist or has been moved."
        action={
          <Link href="/dashboard">
            <Button variant="primary">Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
