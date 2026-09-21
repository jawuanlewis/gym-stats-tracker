"use client";

/**
 * Catches render-time failures, most likely a missing or wrong Supabase
 * configuration. Next.js masks server error messages in production, so this
 * points at the usual cause rather than echoing the error text.
 */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pt-16">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h1 className="text-lg font-semibold">Could not load your stats</h1>
        <p className="mt-2 text-sm text-muted">
          This usually means the database connection is not configured. Check that SUPABASE_URL and
          SUPABASE_SERVICE_ROLE_KEY are set.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
