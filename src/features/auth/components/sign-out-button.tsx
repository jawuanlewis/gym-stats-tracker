"use client";

import { useId, useRef } from "react";
import { useFormStatus } from "react-dom";

import { signOutAction } from "../actions";

/**
 * Signing back in means waiting on an emailed code, so a stray tap here is
 * expensive — the button asks first.
 *
 * A native modal `<dialog>` supplies the focus trap, Escape-to-close, and an
 * inert page behind it. Cancel comes first in the markup, so it is what opens
 * focused: Enter on a mis-tap dismisses rather than signs out.
 */
export function SignOutButton({ email }: Readonly<{ email: string | null }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className="rounded-lg border border-border px-3 py-2 text-xs text-muted transition-colors active:border-accent active:text-accent"
      >
        Sign out
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // A click whose target is the dialog itself landed on the backdrop;
        // the padding lives on the inner div so the panel never counts.
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        // m-auto: Tailwind's reset removes the margin that centers a dialog.
        className="m-auto w-[calc(100%-2rem)] max-w-xs rounded-2xl border border-border bg-surface text-foreground backdrop:bg-background/80"
      >
        <div className="p-5">
          <h2 id={titleId} className="text-base font-semibold">
            Sign out?
          </h2>
          <p className="mt-2 text-sm text-muted">
            {email ? (
              <>
                You are signed in as <span className="wrap-anywhere text-foreground">{email}</span>
                .{" "}
              </>
            ) : null}
            Signing back in takes a new emailed code.
          </p>

          <div className="mt-5 flex gap-2">
            <form method="dialog" className="flex-1">
              <button
                type="submit"
                className="w-full rounded-lg border border-border py-3 text-sm text-muted"
              >
                Cancel
              </button>
            </form>
            <form action={signOutAction} className="flex-1">
              <ConfirmButton />
            </form>
          </div>
        </div>
      </dialog>
    </>
  );
}

function ConfirmButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-danger py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
