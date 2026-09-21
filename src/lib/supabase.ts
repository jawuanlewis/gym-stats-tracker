import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Server-side Supabase client, built lazily.
 *
 * Lazy matters: reading the env vars at module scope would make `next build`
 * fail on any machine without credentials. Building on first call keeps the
 * failure at request time, where it can be reported usefully.
 *
 * Neither value carries a NEXT_PUBLIC_ prefix, so neither is inlined into the
 * client bundle. The service-role key bypasses row-level security and must never
 * reach the browser; the URL simply has no reason to be there.
 */
export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
