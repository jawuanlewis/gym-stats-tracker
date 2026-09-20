"use client";

import { useActionState, useEffect, useRef } from "react";

import { renameExerciseAction, type RenameState } from "../actions";

/**
 * Rendered only while renaming — the card owns the open/closed state so the
 * form can take the full row width instead of sharing it with the delete button.
 */
export function RenameForm({
  id,
  name,
  onDone,
}: Readonly<{ id: string; name: string; onDone: () => void }>) {
  const [state, formAction, pending] = useActionState<RenameState, FormData>(
    renameExerciseAction.bind(null, id),
    {},
  );
  const succeeded = useRef(false);

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
    <form action={formAction} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="name"
          defaultValue={name}
          autoFocus
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
        <button
          type="button"
          onClick={onDone}
          className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </form>
  );
}
