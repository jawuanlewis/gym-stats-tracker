"use client";

import { useActionState } from "react";

import { Collapse } from "@/components/motion";

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

  const onCodeStep = state.step === "code";
  const idleLabel = onCodeStep ? "Sign in" : "Email me a code";
  const busyLabel = onCodeStep ? "Checking…" : "Sending…";

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-surface p-4">
      <div className="space-y-4">
        {/*
          The two steps have the same shape, so only the field is swapped. Keying
          it remounts it on each step: it fades in, and `autoFocus` fires again.
        */}
        <div key={state.step} className="animate-enter space-y-2">
          {onCodeStep ? (
            <>
              <input type="hidden" name="email" value={state.email} />
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
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <Messages state={state} />

        {/* First in the form, so pressing Enter in the field submits this step. */}
        <button
          type="submit"
          name="intent"
          value={onCodeStep ? "verify" : "send"}
          disabled={pending}
          className={primaryButtonClass}
        >
          {pending ? busyLabel : idleLabel}
        </button>
      </div>

      <Collapse open={onCodeStep}>
        <div className="flex gap-2 pt-4">
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
      </Collapse>
    </form>
  );
}

function Messages({ state }: Readonly<{ state: LoginState }>) {
  if (state.error) return <p className="text-sm text-danger">{state.error}</p>;
  if (state.notice) return <p className="text-sm text-muted">{state.notice}</p>;
  return null;
}
