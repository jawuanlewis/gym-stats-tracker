"use client";

import { useActionState } from "react";

import { loginAction, type LoginState } from "../actions";

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent";

const primaryButtonClass =
  "w-full rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground disabled:opacity-50";

const secondaryButtonClass = "flex-1 rounded-lg border border-border py-3 text-sm text-muted";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {
    step: "email",
  });

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      {state.step === "email" ? (
        <>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-muted">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              defaultValue={state.email}
              autoFocus
              required
              className={fieldClass}
            />
          </div>

          <Messages state={state} />

          <button
            type="submit"
            name="intent"
            value="send"
            disabled={pending}
            className={primaryButtonClass}
          >
            {pending ? "Sending…" : "Email me a code"}
          </button>
        </>
      ) : (
        <>
          <input type="hidden" name="email" value={state.email} />
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm text-muted">
              Code sent to <span className="text-foreground">{state.email}</span>
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9 ]*"
              autoFocus
              className={`${fieldClass} font-mono tracking-widest`}
            />
          </div>

          <Messages state={state} />

          {/* First in the form, so pressing Enter in the code field verifies. */}
          <button
            type="submit"
            name="intent"
            value="verify"
            disabled={pending}
            className={primaryButtonClass}
          >
            {pending ? "Checking…" : "Sign in"}
          </button>

          <div className="flex gap-2">
            <button
              type="submit"
              name="intent"
              value="resend"
              disabled={pending}
              formNoValidate
              className={secondaryButtonClass}
            >
              Resend code
            </button>
            <button
              type="submit"
              name="intent"
              value="restart"
              disabled={pending}
              formNoValidate
              className={secondaryButtonClass}
            >
              Different email
            </button>
          </div>
        </>
      )}
    </form>
  );
}

function Messages({ state }: Readonly<{ state: LoginState }>) {
  if (state.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state.notice) return <p className="text-sm text-muted">{state.notice}</p>;
  return null;
}
