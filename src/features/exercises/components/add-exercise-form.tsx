"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { createExerciseAction, type CreateState } from "../actions";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "../types";

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-3 text-base outline-none focus:border-accent";

export function AddExerciseForm() {
  const [open, setOpen] = useState(false);
  // Controlled so a rejected submit (duplicate name) keeps what was typed.
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("upper");
  const [state, formAction, pending] = useActionState<CreateState, FormData>(
    createExerciseAction,
    {},
  );
  const submitted = useRef(false);

  // An empty state after a submit means the exercise was created — close up.
  useEffect(() => {
    if (pending) {
      submitted.current = true;
      return;
    }
    if (submitted.current && !state.error) {
      submitted.current = false;
      setName("");
      setOpen(false);
    }
  }, [pending, state]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-dashed border-border py-4 text-sm font-medium text-muted transition-colors active:border-accent active:text-accent"
      >
        Add exercise
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-border bg-surface p-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm text-muted">
          Exercise
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoFocus
          required
          className={fieldClass}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm text-muted">Category</span>
        <input type="hidden" name="category" value={category} />
        <div className="flex gap-2" role="group" aria-label="Category">
          {CATEGORIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={category === option}
              onClick={() => setCategory(option)}
              className={`flex-1 rounded-lg border py-3 text-sm transition-colors ${
                category === option
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-muted"
              }`}
            >
              {CATEGORY_LABELS[option]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NumberField name="weight" label="Weight" defaultValue={45} step={2.5} min={0} />
        <NumberField name="setCount" label="Sets" defaultValue={3} step={1} min={1} />
        <NumberField name="reps" label="Reps" defaultValue={10} step={1} min={1} />
      </div>

      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-accent py-3 text-sm font-medium text-accent-foreground disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add exercise"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-border px-4 py-3 text-sm text-muted"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function NumberField({
  name,
  label,
  defaultValue,
  step,
  min,
}: Readonly<{
  name: string;
  label: string;
  defaultValue: number;
  step: number;
  min: number;
}>) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="number"
        inputMode="decimal"
        defaultValue={defaultValue}
        step={step}
        min={min}
        required
        className={fieldClass}
      />
    </div>
  );
}
