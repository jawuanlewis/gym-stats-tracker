import "server-only";

import { supabaseExerciseRepository } from "./repository.supabase";
import type { Exercise, ExercisePatch, NewExercise } from "./types";

/**
 * The single seam between the app and its storage.
 *
 * Everything above this line (service, actions, components) is storage-agnostic.
 * Swapping databases means writing another implementation of this interface and
 * reassigning `exerciseRepository` at the bottom of the file.
 */
export interface ExerciseRepository {
  list(): Promise<Exercise[]>;
  findById(id: string): Promise<Exercise | null>;
  findByName(name: string): Promise<Exercise | null>;
  create(input: NewExercise, sortOrder: number): Promise<Exercise>;
  update(id: string, patch: ExercisePatch): Promise<Exercise>;
  /** Renumbers the given exercises to match the order of `orderedIds`. */
  reorder(orderedIds: string[]): Promise<void>;
  remove(id: string): Promise<void>;
}

export const exerciseRepository: ExerciseRepository = supabaseExerciseRepository;
