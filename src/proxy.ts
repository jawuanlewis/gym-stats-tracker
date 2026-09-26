import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseConfig } from "@/lib/supabase-config";

const LOGIN_PATH = "/login";

/**
 * Keeps the Supabase session fresh and sends signed-out visitors to /login.
 *
 * Access tokens are short-lived. Server Components cannot write cookies, so
 * this is where an expiring token gets refreshed and the new cookies written —
 * both onto the request (so this render sees them) and the response (so the
 * browser keeps them).
 *
 * This is a convenience, NOT the security boundary. `requireUser()` guards
 * every page and Server Action, and RLS guards the data behind that.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseConfig();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // No-store cache headers: a CDN must never hand one user's refreshed
        // session cookie to another.
        for (const [key, value] of Object.entries(headers)) response.headers.set(key, value);
      },
    },
  });

  // Must run before anything else reads the session — it is what triggers the refresh.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims.sub);

  // Only redirect page navigations. A Server Action is a POST whose caller
  // expects an action response, not a redirect to an HTML page; those reach
  // `requireUser()`, which redirects in a way the client router understands.
  if (request.method !== "GET" && request.method !== "HEAD") return response;

  const onLoginPage = request.nextUrl.pathname === LOGIN_PATH;
  if (signedIn === onLoginPage) {
    const target = request.nextUrl.clone();
    target.pathname = signedIn ? "/" : LOGIN_PATH;
    target.search = "";

    const redirect = NextResponse.redirect(target);
    // Carry over any cookies written above (a refresh, or clearing a dead session).
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and metadata files.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
