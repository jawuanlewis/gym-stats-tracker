import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

import { DatabaseError, DuplicateExerciseNameError, ExerciseNotFoundError } from "./errors";
import type { ExerciseRepository } from "./repository";
import type { Category, Exercise } from "./types";

const TABLE = "exercises";
const UNIQUE_VIOLATION = "23505";
/** PostgREST: `.single()` matched zero rows. */
const NO_ROWS = "PGRST116";

/** One entry of the `sets` jsonb column. */
type SetRow = { reps: number; weight: number | null };

type ExerciseRow = {
  id: string;
  name: string;
  category: Category;
  /** See `toDomain` for why this is widened. */
  weight: string | number;
  sets: SetRow[] | null;
  created_at: string;
  updated_at: string;
};

/**
 * PostgREST emits `numeric` as an unquoted JSON number, so `weight` already
 * parses as a number and this cast is a no-op today. It stays as a guard: the
 * raw wire value is `110.00`, and any layer that ever hands it over quoted
 * would otherwise turn `weight + 2.5` into string concatenation.
 *
 * (The "numeric arrives as a string" behavior is real, but belongs to the
 * node-postgres driver, not to PostgREST.)
 */
function toDomain(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    weight: Number(row.weight),
    sets: (row.sets ?? []).map((set) => set.reps),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Per-set weight is not a feature yet; the column shape just allows for it. */
function toSetRows(sets: number[]): SetRow[] {
  return sets.map((reps) => ({ reps, weight: null }));
}

function rethrow(operation: string, error: PostgrestError, name?: string): never {
  if (error.code === UNIQUE_VIOLATION) {
    throw new DuplicateExerciseNameError(name ?? "that exercise");
  }
  throw new DatabaseError(operation, error);
}

/**
 * Every query runs as the signed-in user (see `getSupabase`), so RLS already
 * limits it to their rows — no method filters by user_id, and none needs to.
 * Inserts get user_id from the column default, `auth.uid()`.
 */
export const supabaseExerciseRepository: ExerciseRepository = {
  async list() {
    const { data, error } = await (await getSupabase()).from(TABLE).select("*");
    if (error) rethrow("list exercises", error);
    return (data as ExerciseRow[]).map(toDomain);
  },

  async findById(id) {
    const { data, error } = await (
      await getSupabase()
    )
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) rethrow("find exercise by id", error);
    return data ? toDomain(data as ExerciseRow) : null;
  },

  /**
   * Compared in JS rather than with `ilike`, which would treat `%` and `_` in an
   * exercise name as wildcards. The list is small enough that fetching it is
   * cheaper than the escaping bugs, and the per-user unique index is the real
   * guarantee. "The list" is only this user's rows, courtesy of RLS.
   */
  async findByName(name) {
    const { data, error } = await (await getSupabase()).from(TABLE).select("*");
    if (error) rethrow("find exercise by name", error);

    const target = name.trim().toLowerCase();
    const match = (data as ExerciseRow[]).find((row) => row.name.trim().toLowerCase() === target);
    return match ? toDomain(match) : null;
  },

  async create(input) {
    const { data, error } = await (
      await getSupabase()
    )
      .from(TABLE)
      .insert({
        name: input.name,
        category: input.category,
        weight: input.weight,
        sets: toSetRows(input.sets),
      })
      .select()
      .single();
    if (error) rethrow("create exercise", error, input.name);
    return toDomain(data as ExerciseRow);
  },

  async update(id, patch) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.weight !== undefined) payload.weight = patch.weight;
    if (patch.sets !== undefined) payload.sets = toSetRows(patch.sets);

    const { data, error } = await (
      await getSupabase()
    )
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    // Another user's row is invisible under RLS, so it updates nothing rather
    // than failing — indistinguishable from a row that does not exist.
    if (error?.code === NO_ROWS) throw new ExerciseNotFoundError(id);
    if (error) rethrow("update exercise", error, patch.name);
    return toDomain(data as ExerciseRow);
  },

  async remove(id) {
    const { error } = await (await getSupabase()).from(TABLE).delete().eq("id", id);
    if (error) rethrow("delete exercise", error);
  },
};
