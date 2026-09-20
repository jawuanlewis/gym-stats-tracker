"use client";

import { useOptimistic, useState, useTransition } from "react";

import { MINIMUMS, type Increments } from "@/lib/settings";

import {
  addSetAction,
  adjustRepsAction,
  adjustWeightAction,
  deleteExerciseAction,
  removeSetAction,
} from "../actions";
import { formatSets, formatWeight, roundValue } from "../format";
import { MAX_SETS, type Direction, type Exercise } from "../types";
import { RenameForm } from "./rename-form";
import { Stepper } from "./stepper";

/**
 * Every mutation follows the same shape: apply the change locally, then await
 * the Server Action inside the same transition. The optimistic value is what
 * renders, so tapping +2.5 four times in a row lands on +10 rather than reading
 * a stale weight from the last server response.
 */
export function ExerciseCard({
  exercise,
  increments,
}: Readonly<{
  exercise: Exercise;
  increments: Increments;
}>) {
  const [optimistic, applyPatch] = useOptimistic(
    exercise,
    (state: Exercise, patch: Partial<Exercise>) => ({ ...state, ...patch }),
  );
  const [, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function bumpWeight(direction: Direction) {
    startTransition(async () => {
      applyPatch({
        weight: Math.max(
          MINIMUMS.weight,
          roundValue(optimistic.weight + increments.weight * direction),
        ),
      });
      await adjustWeightAction(exercise.id, direction);
    });
  }

  function bumpReps(setIndex: number, direction: Direction) {
    startTransition(async () => {
      applyPatch({
        sets: optimistic.sets.map((reps, index) =>
          index === setIndex ? Math.max(MINIMUMS.reps, reps + increments.reps * direction) : reps,
        ),
      });
      await adjustRepsAction(exercise.id, setIndex, direction);
    });
  }

  function appendSet() {
    startTransition(async () => {
      applyPatch({ sets: [...optimistic.sets, optimistic.sets.at(-1) ?? MINIMUMS.reps] });
      await addSetAction(exercise.id);
    });
  }

  function dropSet(setIndex: number) {
    startTransition(async () => {
      applyPatch({ sets: optimistic.sets.filter((_, index) => index !== setIndex) });
      await removeSetAction(exercise.id, setIndex);
    });
  }

  function confirmDelete() {
    startTransition(async () => {
      await deleteExerciseAction(exercise.id);
    });
  }

  const panelId = `exercise-panel-${exercise.id}`;

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="p-4">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-baseline justify-between gap-3 text-left"
        >
          <span className="min-w-0 truncate text-base font-medium">{optimistic.name}</span>
          <span className="shrink-0 text-sm tabular-nums text-muted">
            {formatSets(optimistic.sets)}
          </span>
        </button>

        <div className="mt-4">
          <Stepper
            spread
            value={formatWeight(optimistic.weight)}
            unit="lb"
            label={`weight for ${optimistic.name}`}
            onAdjust={bumpWeight}
            canDecrease={optimistic.weight > MINIMUMS.weight}
          />
        </div>
      </div>

      {expanded ? (
        <div
          id={panelId}
          className="space-y-4 border-t border-border bg-surface-raised/40 px-4 py-4"
        >
          <ul className="space-y-2">
            {optimistic.sets.map((reps, index) => (
              // Sets are positional and have no stable id; the index is the identity.
              <li key={index} className="flex items-center justify-between gap-2">
                <span className="text-sm text-muted">Set {index + 1}</span>
                <div className="flex items-center gap-1">
                  <Stepper
                    size="sm"
                    value={String(reps)}
                    unit="reps"
                    label={`reps for set ${index + 1} of ${optimistic.name}`}
                    onAdjust={(direction) => bumpReps(index, direction)}
                    canDecrease={reps > MINIMUMS.reps}
                  />
                  <button
                    type="button"
                    aria-label={`Remove set ${index + 1}`}
                    onClick={() => dropSet(index)}
                    disabled={optimistic.sets.length <= 1}
                    className="ml-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors active:text-danger disabled:opacity-25"
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={appendSet}
            disabled={optimistic.sets.length >= MAX_SETS}
            className="w-full rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors active:border-accent active:text-accent disabled:opacity-40"
          >
            Add set
          </button>

          <div className="border-t border-border pt-3">
            {renaming ? (
              <RenameForm
                id={exercise.id}
                name={optimistic.name}
                onDone={() => setRenaming(false)}
              />
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setRenaming(true)}
                  className="text-sm text-accent underline-offset-4 hover:underline"
                >
                  Rename
                </button>

                {confirmingDelete ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={confirmDelete}
                      className="rounded-lg bg-danger px-3 py-2 text-sm font-medium text-accent-foreground"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="text-sm text-muted"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    className="text-sm text-danger underline-offset-4 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </li>
  );
}
