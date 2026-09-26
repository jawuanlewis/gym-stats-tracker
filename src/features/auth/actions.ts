"use server";

import type { AuthError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getSupabase } from "@/lib/supabase";

/**
 * Passwordless sign-in: email a one-time code, then verify it. Signing in and
 * signing up are the same flow — an unknown email gets an account created.
 *
 * A code rather than a magic link on purpose: email apps often open links in
 * their own in-app browser, which would sign the user in there instead of in
 * the browser they actually use. A typed code signs in wherever it is typed,
 * and works unchanged in a future native app.
 */

export type LoginState = {
  step: "email" | "code";
  email?: string;
  error?: string;
  notice?: string;
};

// Deliberately loose: the real check is whether the code arrives.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Supabase's code length is configurable (6 by default, up to 10).
const CODE_PATTERN = /^\d{6,10}$/;

function describe(error: AuthError, fallback: string): string {
  if (error.status === 429) return "Too many attempts. Wait a minute, then try again.";
  // A mistyped or stale code is routine; anything else (bad key, SMTP down) is not.
  if (error.code === "otp_expired") return fallback;
  console.error(`Supabase auth error [${error.code ?? error.status}]: ${error.message}`);
  return fallback;
}

async function sendCode(email: string): Promise<string | null> {
  const supabase = await getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  return error ? describe(error, "Could not send a code. Try again.") : null;
}

export async function loginAction(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const intent = String(formData.get("intent") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (intent === "restart") return { step: "email", email };

  if (!EMAIL_PATTERN.test(email)) {
    return { step: "email", email, error: "Enter a valid email address." };
  }

  if (intent === "send" || intent === "resend") {
    const error = await sendCode(email);
    if (error) return { step: intent === "send" ? "email" : "code", email, error };
    return {
      step: "code",
      email,
      notice: intent === "resend" ? "A new code is on its way." : undefined,
    };
  }

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!CODE_PATTERN.test(code)) {
    return { step: "code", email, error: "Enter the code from the email." };
  }

  const supabase = await getSupabase();
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: "email" });
  if (error) {
    return {
      step: "code",
      email,
      error: describe(error, "That code is wrong or has expired."),
    };
  }

  redirect("/");
}

export async function signOutAction(): Promise<void> {
  const supabase = await getSupabase();
  // "local" ends this device's session only. Signing out at the gym should not
  // also sign the user out on their other devices.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
