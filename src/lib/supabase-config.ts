/**
 * Supabase connection settings, shared by the request-scoped client in
 * `supabase.ts` and by `proxy.ts` — which is why this file has no
 * `next/headers` or `server-only` import.
 *
 * Read at call time, not module scope, so `next build` works on a machine with
 * no credentials and the failure surfaces at request time.
 *
 * Neither value carries a NEXT_PUBLIC_ prefix: every Supabase call happens on
 * the server, so neither is inlined into the client bundle. The anon key is not
 * a secret the way the service-role key was — RLS is what protects the data —
 * but it has no reason to reach the browser either.
 */
export function getSupabaseConfig(): { url: string; anonKey: string } {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env.local and set " +
        "SUPABASE_URL and SUPABASE_ANON_KEY.",
    );
  }
  return { url, anonKey };
}
