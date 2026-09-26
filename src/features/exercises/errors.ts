import type { PostgrestError } from "@supabase/supabase-js";

/**
 * Thrown when a write loses the race against the `exercises_name_unique` index.
 * The service layer's friendly check is a read-then-write, so the database is
 * what actually guarantees the rule.
 *
 * Lives in its own module so the repository interface and its implementation
 * do not have to import each other at runtime.
 */
export class DuplicateExerciseNameError extends Error {
  constructor(name: string) {
    super(`An exercise named "${name}" already exists.`);
    this.name = "DuplicateExerciseNameError";
  }
}

/**
 * The exercise does not exist, or belongs to another user — RLS makes those two
 * cases look identical, which is the point.
 */
export class ExerciseNotFoundError extends Error {
  constructor(id: string) {
    super(`Exercise ${id} not found`);
    this.name = "ExerciseNotFoundError";
  }
}

/**
 * Wraps a PostgrestError while keeping the parts that make it diagnosable.
 *
 * Postgres answers most failures with a SQLSTATE code and, often, a `hint`
 * naming the exact fix — `42501` arrives with "Grant the required privileges
 * to the current role with: GRANT SELECT ON ... ". Collapsing all of that into
 * `error.message` throws away the answer, so everything is preserved both as
 * structured fields and in the message text that reaches the server log.
 */
export class DatabaseError extends Error {
  readonly code: string | null;
  readonly details: string | null;
  readonly hint: string | null;

  constructor(operation: string, error: PostgrestError) {
    const parts = [`${operation} failed`];
    if (error.code) parts.push(`[${error.code}]`);
    parts.push(`- ${error.message}`);
    if (error.details) parts.push(`| details: ${error.details}`);
    if (error.hint) parts.push(`| hint: ${error.hint}`);

    super(parts.join(" "), { cause: error });
    this.name = "DatabaseError";
    this.code = error.code ?? null;
    this.details = error.details ?? null;
    this.hint = error.hint ?? null;
  }
}
