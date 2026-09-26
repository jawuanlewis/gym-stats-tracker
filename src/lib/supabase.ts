import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

import { getSupabaseConfig } from "./supabase-config";

/**
 * Supabase client acting as the signed-in user, built once per request.
 *
 * It carries the user's session from the auth cookies, so every query runs as
 * the `authenticated` role under row-level security: Postgres, not this app,
 * decides which rows are visible. Never share one across requests — `cache`
 * scopes it to a single request, which is exactly the lifetime it needs.
 */
export const getSupabase = cache(async () => {
  // cookies() first: it marks the route dynamic, so `next build` never tries to
  // prerender a page through here and trip over missing credentials.
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseConfig();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot set cookies. That is fine: proxy.ts has
          // already refreshed the session on the way in, and Server Actions
          // (where sign-in and sign-out write cookies) can set them.
        }
      },
    },
  });
});
