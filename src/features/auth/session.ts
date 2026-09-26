import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { getSupabase } from "@/lib/supabase";

export type SessionUser = { id: string; email: string | null };

/**
 * The signed-in user, or null. Memoized per request.
 *
 * `getClaims()` verifies the access token's signature (locally with asymmetric
 * signing keys, or via the Auth server otherwise). Never use `getSession()` for
 * this on the server — it returns whatever the cookie says, unverified.
 */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await getSupabase();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) return null;

  return { id: data.claims.sub, email: data.claims.email ?? null };
});

/**
 * The authorization gate. Every Server Action and every page that reads user
 * data calls this first — proxy.ts only redirects as a convenience and cannot
 * see Server Action POSTs reliably. RLS is the backstop behind this.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
