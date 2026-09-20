/**
 * Shared exercise types. Safe to import from both server and client components —
 * keep runtime/server-only code out of this file.
 */

export const CATEGORIES = ["upper", "lower"] as const;

/** Upper bound on sets per exercise, so the expanded card stays scannable. */
export const MAX_SETS = 10;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  upper: "Upper Body",
  lower: "Lower Body",
};

export type Exercise = {
  id: string;
  name: string;
  category: Category;
  /** Working weight in lb. Shared across all sets for now — see README "Future Features". */
  weight: number;
  /** Reps per set, in order. Length is the number of sets. */
  sets: number[];
  createdAt: string;
  updatedAt: string;
};

export type NewExercise = {
  name: string;
  category: Category;
  weight: number;
  sets: number[];
};

export type ExercisePatch = Partial<Omit<Exercise, "id" | "createdAt" | "updatedAt">>;

/** Which numeric field a stepper is adjusting. Maps onto the increment settings. */
export type AdjustableField = "weight" | "reps";

export type Direction = 1 | -1;
