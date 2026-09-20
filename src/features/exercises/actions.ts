"use server";

import { refresh } from "next/cache";

import {
  addSet,
  adjustReps,
  adjustWeight,
  createExercise,
  deleteExercise,
  removeSet,
  renameExercise,
} from "./service";
import { CATEGORIES, type Category, type Direction } from "./types";

/**
 * NOTE: Server Actions are reachable by direct POST, not only through this UI.
 * There is no auth in v1 (single user, unlisted deployment). If this app ever
 * gains more than one user, every action below needs an authorization check.
 */

function parseCategory(value: FormDataEntryValue | null): Category | null {
  return CATEGORIES.includes(value as Category) ? (value as Category) : null;
}

export type CreateState = { error?: string };

export async function createExerciseAction(
  _previous: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const name = String(formData.get("name") ?? "");
  const category = parseCategory(formData.get("category"));
  const weight = Number(formData.get("weight"));
  const setCount = Number(formData.get("setCount"));
  const reps = Number(formData.get("reps"));

  if (!category) return { error: "Pick a category." };
  if (!Number.isInteger(setCount) || setCount < 1) return { error: "Sets must be at least 1." };
  if (!Number.isInteger(reps) || reps < 1) return { error: "Reps must be at least 1." };

  const result = await createExercise({
    name,
    category,
    weight,
    sets: Array.from({ length: setCount }, () => reps),
  });

  if (!result.ok) return { error: result.error };

  refresh();
  return {};
}

export type RenameState = { error?: string };

export async function renameExerciseAction(
  id: string,
  _previous: RenameState,
  formData: FormData,
): Promise<RenameState> {
  const result = await renameExercise(id, String(formData.get("name") ?? ""));
  if (!result.ok) return { error: result.error };

  refresh();
  return {};
}

export async function adjustWeightAction(id: string, direction: Direction): Promise<void> {
  await adjustWeight(id, direction);
  refresh();
}

export async function adjustRepsAction(
  id: string,
  setIndex: number,
  direction: Direction,
): Promise<void> {
  await adjustReps(id, setIndex, direction);
  refresh();
}

export async function addSetAction(id: string): Promise<void> {
  await addSet(id);
  refresh();
}

export async function removeSetAction(id: string, setIndex: number): Promise<void> {
  await removeSet(id, setIndex);
  refresh();
}

export async function deleteExerciseAction(id: string): Promise<void> {
  await deleteExercise(id);
  refresh();
}
