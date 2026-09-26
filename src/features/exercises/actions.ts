"use server";

import { refresh } from "next/cache";

import { requireUser } from "@/features/auth/session";

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
 * Server Actions are reachable by direct POST, not only through this UI, so
 * every action below starts with `requireUser()`. Keep it that way for any new
 * action. Which rows a user may touch is then enforced by RLS in the database.
 */

function parseCategory(value: FormDataEntryValue | null): Category | null {
  return CATEGORIES.includes(value as Category) ? (value as Category) : null;
}

export type CreateState = { error?: string };

export async function createExerciseAction(
  _previous: CreateState,
  formData: FormData,
): Promise<CreateState> {
  await requireUser();
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
  await requireUser();
  const result = await renameExercise(id, String(formData.get("name") ?? ""));
  if (!result.ok) return { error: result.error };

  refresh();
  return {};
}

export async function adjustWeightAction(id: string, direction: Direction): Promise<void> {
  await requireUser();
  await adjustWeight(id, direction);
  refresh();
}

export async function adjustRepsAction(
  id: string,
  setIndex: number,
  direction: Direction,
): Promise<void> {
  await requireUser();
  await adjustReps(id, setIndex, direction);
  refresh();
}

export async function addSetAction(id: string): Promise<void> {
  await requireUser();
  await addSet(id);
  refresh();
}

export async function removeSetAction(id: string, setIndex: number): Promise<void> {
  await requireUser();
  await removeSet(id, setIndex);
  refresh();
}

export async function deleteExerciseAction(id: string): Promise<void> {
  await requireUser();
  await deleteExercise(id);
  refresh();
}
