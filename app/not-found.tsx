import Link from "next/link";
import { Film } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-lg">
        <EmptyState
          icon={Film}
          title="Movie not found"
          description="This movie may have been removed or the link is incorrect. Browse the latest releases instead."
          action={
            <Link
              href="/movies"
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-amber-400"
            >
              Browse movies
            </Link>
          }
        />
      </div>
    </div>
  );
}
