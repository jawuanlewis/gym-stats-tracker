/**
 * Increment settings.
 *
 * These are the only place the step sizes are defined — no component should ever
 * hardcode 2.5. When user-editable settings land (see README "Future Features"),
 * `getIncrements` becomes a DB read and everything downstream keeps working.
 */

import type { AdjustableField } from "@/features/exercises/types";

export type Increments = Record<AdjustableField, number>;

export const DEFAULT_INCREMENTS: Increments = {
  weight: 2.5,
  reps: 1,
};

/** Lower bounds, so steppers can't drive a value into nonsense. */
export const MINIMUMS: Increments = {
  weight: 0,
  reps: 1,
};

export async function getIncrements(): Promise<Increments> {
  return DEFAULT_INCREMENTS;
}
