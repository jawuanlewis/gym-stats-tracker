import type { Exercise } from "./types";

/**
 * Collapse the per-set reps into something readable at a glance:
 * uniform reps read as "3 × 10", varied reps read as "12 / 10 / 8".
 */
export function formatSets(sets: number[]): string {
  if (sets.length === 0) return "No sets";
  const uniform = sets.every((reps) => reps === sets[0]);
  return uniform ? `${sets.length} × ${sets[0]}` : sets.join(" / ");
}

/** Trims the trailing ".0" that 2.5-step weights produce half the time. */
export function formatWeight(weight: number): string {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

export function totalReps(exercise: Exercise): number {
  return exercise.sets.reduce((sum, reps) => sum + reps, 0);
}

/** 2.5-step arithmetic drifts in binary floating point; snap it back. */
export function roundValue(value: number): number {
  return Math.round(value * 100) / 100;
}
