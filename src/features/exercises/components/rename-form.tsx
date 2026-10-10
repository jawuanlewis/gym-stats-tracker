"use client";

import { useActionState, useEffect, useRef } from "react";

import { FormError, useDismissibleError } from "@/components/form-error";

import { renameExerciseAction, type RenameState } from "../actions";

/**
 * The card owns the open/closed state so the form can take the full row width
 * instead of sharing it with the delete button. It stays mounted while closed
 * (the card fades it out), hence `open`: focus has to be given, not `autoFocus`ed.
 */
export function RenameForm({
  id,
  name,
  open,
  onDone,
}: Readonly<{ id: string; name: string; open: boolean; onDone: () => void }>) {
  const [state, formAction, pending] = useActionState<RenameState, FormData>(
    renameExerciseAction.bind(null, id),
    {},
  );
  const showError = useDismissibleError(state, open);
  const succeeded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // A successful rename returns an empty state; close the form once that lands.
  useEffect(() => {
    if (pending) {
      succeeded.current = true;
      return;
    }
    if (succeeded.current && !state.error) {
      succeeded.current = false;
      onDone();
    }
  }, [pending, state, onDone]);

  return (
    <form action={formAction}>
      <div className="flex gap-2">
        <input
          name="name"
          defaultValue={name}
          ref={inputRef}
          aria-label="Exercise name"
          className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-base outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          Save
        </button>
        {/* reset: a cancelled rename reopens showing the current name, not the abandoned edit. */}
        <button
          type="reset"
          onClick={onDone}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
      <FormError show={showError} message={state.error} className="pt-2" />
    </form>
  );
}
