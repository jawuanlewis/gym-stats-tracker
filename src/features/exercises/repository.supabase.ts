import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

import { DuplicateExerciseNameError } from "./errors";
import type { ExerciseRepository } from "./repository";
import type { Category, Exercise } from "./types";

const TABLE = "exercises";
const UNIQUE_VIOLATION = "23505";

/** One entry of the `sets` jsonb column. */
type SetRow = { reps: number; weight: number | null };

type ExerciseRow = {
  id: string;
  name: string;
  category: Category;
  /** `numeric` arrives as a string over the wire — see `toDomain`. */
  weight: string | number;
  sets: SetRow[] | null;
  created_at: string;
  updated_at: string;
};

/**
 * Postgres `numeric` is serialized as a STRING by PostgREST to avoid float
 * precision loss. Without this conversion, `"110.00" + 2.5` would concatenate
 * into `"110.002.5"` rather than adding.
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

function rethrow(error: PostgrestError, name?: string): never {
  if (error.code === UNIQUE_VIOLATION) {
    throw new DuplicateExerciseNameError(name ?? "that exercise");
  }
  throw new Error(`Supabase: ${error.message}`);
}

export const supabaseExerciseRepository: ExerciseRepository = {
  async list() {
    const { data, error } = await getSupabase().from(TABLE).select("*");
    if (error) rethrow(error);
    return (data as ExerciseRow[]).map(toDomain);
  },

  async findById(id) {
    const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) rethrow(error);
    return data ? toDomain(data as ExerciseRow) : null;
  },

  /**
   * Compared in JS rather than with `ilike`, which would treat `%` and `_` in an
   * exercise name as wildcards. The list is small enough that fetching it is
   * cheaper than the escaping bugs, and the unique index is the real guarantee.
   */
  async findByName(name) {
    const { data, error } = await getSupabase().from(TABLE).select("*");
    if (error) rethrow(error);

    const target = name.trim().toLowerCase();
    const match = (data as ExerciseRow[]).find((row) => row.name.trim().toLowerCase() === target);
    return match ? toDomain(match) : null;
  },

  async create(input) {
    const { data, error } = await getSupabase()
      .from(TABLE)
      .insert({
        name: input.name,
        category: input.category,
        weight: input.weight,
        sets: toSetRows(input.sets),
      })
      .select()
      .single();
    if (error) rethrow(error, input.name);
    return toDomain(data as ExerciseRow);
  },

  async update(id, patch) {
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) payload.name = patch.name;
    if (patch.category !== undefined) payload.category = patch.category;
    if (patch.weight !== undefined) payload.weight = patch.weight;
    if (patch.sets !== undefined) payload.sets = toSetRows(patch.sets);

    const { data, error } = await getSupabase()
      .from(TABLE)
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) rethrow(error, patch.name);
    return toDomain(data as ExerciseRow);
  },

  async remove(id) {
    const { error } = await getSupabase().from(TABLE).delete().eq("id", id);
    if (error) rethrow(error);
  },
};
