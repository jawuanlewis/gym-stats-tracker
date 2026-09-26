import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/features/auth/components/login-form";
import { getUser } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in · Gym Stats Tracker",
};

export default async function LoginPage() {
  if (await getUser()) redirect("/");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 pb-16 pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Gym Stats</h1>
        <p className="mt-1 text-sm text-muted">
          Sign in or create an account with a one-time code. No password needed.
        </p>
      </header>

      <LoginForm />
    </main>
  );
}
