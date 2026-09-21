import "server-only";

import { getIncrements, MINIMUMS } from "@/lib/settings";

import { DuplicateExerciseNameError } from "./errors";
import { roundValue } from "./format";
import { exerciseRepository } from "./repository";
import {
  CATEGORIES,
  MAX_SETS,
  type Category,
  type Direction,
  type Exercise,
  type NewExercise,
} from "./types";

export type ServiceResult<T> = { ok: true; data: T } | { ok: false; error: string };

function categoryRank(category: Category): number {
  return CATEGORIES.indexOf(category);
}

export async function listExercises(): Promise<Exercise[]> {
  const exercises = await exerciseRepository.list();
  return exercises.sort(
    (a, b) =>
      categoryRank(a.category) - categoryRank(b.category) || a.createdAt.localeCompare(b.createdAt),
  );
}

export async function createExercise(input: NewExercise): Promise<ServiceResult<Exercise>> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Give the exercise a name." };

  // Case-insensitive duplicate guard
  const existing = await exerciseRepository.findByName(name);
  if (existing) return { ok: false, error: `"${existing.name}" is already on your list.` };

  if (!Number.isFinite(input.weight) || input.weight < MINIMUMS.weight) {
    return { ok: false, error: "Weight must be zero or more." };
  }
  if (input.sets.length === 0) return { ok: false, error: "Add at least one set." };

  try {
    return {
      ok: true,
      data: await exerciseRepository.create({ ...input, name, weight: roundValue(input.weight) }),
    };
  } catch (error) {
    return asDuplicateResult(error, name);
  }
}

/**
 * The checks above are read-then-write, so the unique index can still reject a
 * write that raced past them. Surface that as the same message rather than an
 * unhandled error.
 */
function asDuplicateResult<T>(error: unknown, name: string): ServiceResult<T> {
  if (error instanceof DuplicateExerciseNameError) {
    return { ok: false, error: `"${name}" is already on your list.` };
  }
  throw error;
}

export async function renameExercise(id: string, name: string): Promise<ServiceResult<Exercise>> {
  const trimmed = name.trim();
  if (!trimmed) return { ok: false, error: "Give the exercise a name." };

  const existing = await exerciseRepository.findByName(trimmed);
  if (existing && existing.id !== id) {
    return { ok: false, error: `"${existing.name}" is already on your list.` };
  }

  try {
    return { ok: true, data: await exerciseRepository.update(id, { name: trimmed }) };
  } catch (error) {
    return asDuplicateResult(error, trimmed);
  }
}

async function requireExercise(id: string): Promise<Exercise> {
  const exercise = await exerciseRepository.findById(id);
  if (!exercise) throw new Error(`Exercise ${id} not found`);
  return exercise;
}

export async function adjustWeight(id: string, direction: Direction): Promise<Exercise> {
  const exercise = await requireExercise(id);
  const { weight: step } = await getIncrements();
  const next = Math.max(MINIMUMS.weight, roundValue(exercise.weight + step * direction));
  return exerciseRepository.update(id, { weight: next });
}

export async function adjustReps(
  id: string,
  setIndex: number,
  direction: Direction,
): Promise<Exercise> {
  const exercise = await requireExercise(id);
  if (setIndex < 0 || setIndex >= exercise.sets.length) {
    throw new Error(`Set ${setIndex} is out of range`);
  }

  const { reps: step } = await getIncrements();
  const sets = exercise.sets.map((reps, index) =>
    index === setIndex ? Math.max(MINIMUMS.reps, reps + step * direction) : reps,
  );
  return exerciseRepository.update(id, { sets });
}

export async function addSet(id: string): Promise<Exercise> {
  const exercise = await requireExercise(id);
  if (exercise.sets.length >= MAX_SETS) return exercise;

  // Mirror the last set — the common case is another set at the same reps.
  const last = exercise.sets.at(-1) ?? MINIMUMS.reps;
  return exerciseRepository.update(id, { sets: [...exercise.sets, last] });
}

export async function removeSet(id: string, setIndex: number): Promise<Exercise> {
  const exercise = await requireExercise(id);
  if (exercise.sets.length <= 1) return exercise;

  return exerciseRepository.update(id, {
    sets: exercise.sets.filter((_, index) => index !== setIndex),
  });
}

export async function deleteExercise(id: string): Promise<void> {
  await exerciseRepository.remove(id);
}
