"use client";

import { useActionState, useRef, useState } from "react";

import { Collapse } from "@/components/motion";

import { loginAction, type LoginState } from "../actions";
import { CODE_LENGTH, normalizeCode } from "../code";

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
  const submitRef = useRef<HTMLButtonElement>(null);

  // Keeps only the digits, and signs in as soon as the code is complete —
  // whether it was typed, pasted, or filled in from the email by iOS AutoFill.
  // Exactly complete, not "at least": a paste with extra digits is not
  // guessed at. A rejected code needs no handling here; React resets the
  // form's uncontrolled fields after every action, so the field comes back empty.
  function handleCodeChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    // The field is uncontrolled (it is remounted per step), so tidy it in place.
    input.value = normalizeCode(input.value);
    if (input.value.length === CODE_LENGTH && !pending) {
      input.form?.requestSubmit(submitRef.current);
    }
  }

  return (
    <form action={formAction} className="rounded-2xl border border-border bg-surface p-4">
      <div className="space-y-4">
        {/* One wrapper, so the folded message leaves no space-y gap behind. */}
        <div>
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
                  pattern="[0-9]*"
                  onChange={handleCodeChange}
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
        </div>

        {/* First in the form, so pressing Enter in the field submits this step. */}
        <button
          ref={submitRef}
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

/**
 * The step's error or notice, folding open and closed like `FormError`. The
 * last message stays rendered while it folds away, so it does not blank
 * mid-animation. `pt-4` is the gap above it, inside the fold.
 */
function Messages({ state }: Readonly<{ state: LoginState }>) {
  const current = state.error
    ? { text: state.error, className: "text-danger" }
    : state.notice
      ? { text: state.notice, className: "text-muted" }
      : null;
  const [last, setLast] = useState(current);
  // Adjusting state during render, not in an effect, so the new message is in
  // the first frame that unfolds it.
  if (current && (current.text !== last?.text || current.className !== last.className)) {
    setLast(current);
  }
  const shown = current ?? last;

  return (
    <Collapse open={current !== null}>
      <p className={`pt-4 text-sm ${shown?.className ?? ""}`}>{shown?.text}</p>
    </Collapse>
  );
}
